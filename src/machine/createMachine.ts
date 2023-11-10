/* eslint-disable @typescript-eslint/no-explicit-any */
import { MachineConfig } from "./MachineConfig";
import { State } from "./State";
import { IDefaultEvent, TDefaultContext, TDefaultStates, TStateEvent } from "./types";

export type TCurrentState<U, V extends TDefaultStates> = {
    value: V[number];
    history: V[number];
    context: U
}

type TSubscribeCb<U, V extends TDefaultStates> = (state: TCurrentState<U, V>) => any

export type TSubscribe<U, V extends TDefaultStates> = (type: TSubscriberType, cb: TSubscribeCb<U, V>) => void;

export type THandle<V extends TDefaultStates> = {
    source: V[number][];
    target: V[number][];
}

type TEdge<V extends TDefaultStates> = {
    type: 'custom' | 'selfConnecting';
    source: V[number];
    target: V[number];
    sourceHandle: V[number];
    id: string;
    label: string;
    animated: boolean;
}

export type TInspectReturnType<V extends TDefaultStates> = {
    nodes: {
        id: V[number];
        data: {
            label: V[number];
            handles: THandle<V>;
        };
    }[]
    edges: TEdge<V>[]
}

type TCreateMachineReturn<U, V extends TDefaultStates, W extends IDefaultEvent> = {
    state: TCurrentState<U, V>;
    send: (event: W['type'] | W) => void;
    subscribe: TSubscribe<U, V>
    start: () => void;
    inspect: () => TInspectReturnType<V>
}

type TInternalState = 'entered' | 'living' | 'exited' | 'dead'

type TSubscriberType = 'allChanges' | 'stateChange' | 'contextChange'


export function createMachine<U extends TDefaultContext, V extends TDefaultStates, W extends IDefaultEvent>(config: MachineConfig<U, V, W>, context: Partial<U> = {} as U): TCreateMachineReturn<U, V, W> {
    const { states, context: initialContext } = config;
    let _context = { ...initialContext, ...context };
    const initialStateValue: keyof typeof states = Object.keys(states)[0];
    let _currentState = states[initialStateValue]
    const currentState = {
        value: _currentState.value,
        history: _currentState.value,
        context: _context // TODO: Should deep clone this
    }

    let isStarted = false;
    let _internalState: TInternalState = 'dead';
    let callbacksArr: {
        type: TSubscriberType,
        cb: TSubscribeCb<U, V>
    }[] = [];

    let _cleanUpEffectsQueue: Array<() => any> = [];

    function _setIsStarted(value: boolean) {
        isStarted = value;
    }

    function _getIsStarted() {
        return isStarted;
    }

    function _setContext(newContext: U) {
        _context = { ...newContext };
        currentState.context = _context;
        _runSubscriberCallbacks('contextChange')
    }

    function _setCurrentState(newState: State<U, V, W>) {
        currentState.history = _currentState.value;
        _currentState = newState;
        currentState.value = newState.value;
        _runSubscriberCallbacks('stateChange')
    }

    function _runEffects(effects: TStateEvent<U, W>[], actionType: string | symbol, data: Record<string, any> = {}) {
        effects.forEach(effect => {
            const { type, callback } = effect;
            if (type === 'updateContext') {
                const newContext = callback(_context, { type: actionType, data } as W)
                _setContext(newContext)
            }
            if (type === 'fireAndForget') {
                callback(_context, { type: actionType, data } as W)
            }
        })
    }

    function _runCleanupEffects() {
        _cleanUpEffectsQueue.forEach(effect => {
            if (typeof effect === 'function') {
                effect();
            }
        })
        _cleanUpEffectsQueue = []
    }

    function _runEntry(state: State<U, V, W>) {
        _internalState = 'entered'
        _setCurrentState(state)
        const { stateJSON, stateEventsMap } = _getStateConfig(state);
        const enteredJSON = stateJSON['##enter##'];
        if (!enteredJSON) {
            return _runAlways(state);

        }
        const { target, cond } = enteredJSON;
        if (cond(_context)) {
            const effects = stateEventsMap.get('##enter##')?.stateEventCollection ?? [];
            _runEffects(effects, '##enter##')
            if (target !== currentState.value) {
                const nextState = states[target]
                return _runExit(state, nextState)
            }
        }
        return _runAlways(state);
    }

    function _runAlways(state: State<U, V, W>) {
        _internalState = 'living';
        const { stateJSON, stateEventsMap } = _getStateConfig(state);
        const alwaysJSONArr = Reflect.ownKeys(stateJSON)
            .filter(val => {
                return typeof val === 'symbol' && val.description === '##always##'
            });

        if (alwaysJSONArr.length === 0) {
            return _runService(state);
        }

        alwaysJSONArr.every((event) => {
            const { target, cond, isSetByDefault } = stateJSON[event];
            if (cond(_context)) {
                const effects = stateEventsMap.get(event)?.stateEventCollection ?? [];
                _runEffects(effects, event);
                if (!isSetByDefault) {
                    const nextState = states[target];
                    return (_runExit(state, nextState), false);
                }
            }
            return true;
        });

        return _runService(state)
    }

    function _runService(state: State<U, V, W>) {
        _internalState = 'living';
        const { callback: service } = _getStateConfig(state);
        const cleanUpEffects = service(_context, send);
        _cleanUpEffectsQueue.push(cleanUpEffects);
        _runAfter(state)
    }

    function _runAfter(state: State<U, V, W>) {
        _internalState = 'living'
        const { delay, stateEventsMap, stateJSON } = _getStateConfig(state);
        const afterJSON = stateJSON['##after##'];
        if (!afterJSON || !delay) {
            return;
        }
        const { target, cond, isSetByDefault } = afterJSON;
        if (cond(_context)) {
            const effects = stateEventsMap.get('##after##')?.stateEventCollection ?? [];
            const _timerId = setTimeout(() => {
                _runEffects(effects, '##after##')
                if (!isSetByDefault) {
                    const nextState = states[target]
                    _runExit(state, nextState)
                }
            }, delay);
            const cleanUpEffect = () => clearTimeout(_timerId)
            _cleanUpEffectsQueue.push(cleanUpEffect)
        }
    }



    function _runLive(state: State<U, V, W>, actionType: string | symbol, data: Record<string, any>) {
        _internalState = 'living'
        const { stateEventsMap, stateJSON } = _getStateConfig(state);
        const eventJSON = stateJSON[actionType];
        if (!eventJSON) {
            return;
        }
        const { target, cond, isSetByDefault } = eventJSON;
        if (cond(_context)) {
            const effects = stateEventsMap.get(actionType)?.stateEventCollection ?? [];
            _runEffects(effects, actionType, data)
            const nextState = states[target]
            if (!isSetByDefault) {
                return _runExit(state, nextState)
            }
        }
    }

    function _runExit(state: State<U, V, W>, nextState: State<U, V, W>) {
        _internalState = 'exited';
        _runCleanupEffects()
        const { stateJSON, stateEventsMap } = _getStateConfig(state);
        const exitedJSON = stateJSON['##exit##'];
        if (!exitedJSON) {
            _next(nextState)
            return
        }
        const effects = stateEventsMap.get('##exit##')?.stateEventCollection ?? [];
        _runEffects(effects, '##exit##')
        _next(nextState)
        return;
    }

    function _runSubscriberCallbacks(type: TSubscriberType) {
        callbacksArr.forEach(callback => {
            if (callback.type === 'allChanges') {
                callback.cb(currentState)
            }
            else if (callback.type === type) {
                callback.cb(currentState)
            }
        })
    }

    function _next(nextState: State<U, V, W>, actionType: string | symbol = '', data: Record<string, any> = {}) {
        if (_internalState === 'dead') {
            _setIsStarted(true)
            _runEntry(nextState)
        }
        else if (_internalState === 'exited') {
            _runEntry(nextState)
        }
        else if (_internalState === 'living') {
            _runLive(nextState, actionType, data)
        }
    }

    function _getStateConfig(state: State<U, V, W>) {
        return state.getConfig()
    }

    function send(action: W['type'] | W) {
        if (!_getIsStarted()) {
            console.warn('start the machine using .start method before sending the events');
            return;
        }
        if (typeof action === "object")
            _next(_currentState, action.type, action.data)
        else
            _next(_currentState, action)
    }
    function subscribe(type: TSubscriberType, cb: TSubscribeCb<U, V>) {
        callbacksArr = [...callbacksArr, { type, cb }]
    }
    function start() {
        _next(_currentState)
    }

    function inspect() {
        const stateHandles: Record<string, {
            source: string[];
            target: string[]
        }> = {}
        for (const state in states) {
            const _state: V[number] = state;
            const { stateJSON } = _getStateConfig(states[_state]);
            stateHandles[_state] = {
                source: [],
                target: stateHandles[_state]?.target ?? []
            }
            Reflect.ownKeys(stateJSON)
                .forEach(el => {
                    const actionName = typeof el === 'symbol' ? el.description ?? '' : el;
                    const target = stateJSON[el].target;
                    const stateHandle = stateHandles[target];
                    stateHandles[_state].source.push(actionName + _state + target)
                    if (stateHandle?.target) {
                        stateHandle.target.push(actionName + target + _state)
                    }
                    else {
                        stateHandles[target] = {
                            source: [],
                            target: [actionName + target + _state]
                        }
                    }
                })
        }
        const nodes = Object.keys(states)
            .map((stateVal: V[number]) => {
                return {
                    id: stateVal,
                    data: {
                        label: stateVal,
                        handles: stateHandles[stateVal]
                    }
                }
            });
        console.log(nodes)
        const edges = Object.keys(states)
            .map((stateVal: V[number]) => {
                const state = states[stateVal];
                const { stateJSON } = _getStateConfig(state)
                const result = Reflect.ownKeys(stateJSON)
                    .map((el: string | symbol) => {
                        const actionName = typeof el === 'symbol' ? el.description ?? '' : el;
                        const source = stateVal;
                        const target = stateJSON[el].target
                        const res: TEdge<V> = {
                            type: source === target ? 'custom' : 'custom',
                            source: source,
                            target: target,
                            sourceHandle: actionName + source + target,
                            label: actionName,
                            id: `e-${actionName}-${source}-${target}`,
                            animated: true
                        }
                        return res;
                    })
                return result
            })
            .flat();
        return { nodes, edges };
    }

    return { state: currentState, send, subscribe, start, inspect };
}