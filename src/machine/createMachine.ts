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

export type TSubscribe<U, V extends TDefaultStates> = (type: TSubscriberType, cb: TSubscribeCb<U, V>) => () => void;

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

type TInternalStateEnum = 'entered' | 'living' | 'exited' | 'dead';
type TInternalState<V extends TDefaultStates> = {
    value: TInternalStateEnum,
    stateValue: V[number]
}

type TSubscriberType = 'allChanges' | 'stateChange' | 'contextChange'



export function createMachine<U extends TDefaultContext, V extends TDefaultStates, W extends IDefaultEvent>(config: MachineConfig<U, V, W>, context: Partial<U> = {} as U): TCreateMachineReturn<U, V, W> {
    // const { states, context: initialContext } = config;
    const { states, context: initialContext, stateEventsMap: masterStateEventsMap, stateJSON: masterStateJSON } = config.getConfig();
    let _context = { ...initialContext, ...context };
    const initialStateValue: keyof typeof states = Object.keys(states)[0];
    let _currentState = states[initialStateValue]
    const _debug = false;
    const currentState = {
        value: _currentState.value,
        history: _currentState.value,
        context: _context // TODO: Should deep clone this
    }

    let isStarted = false;
    const _internalState: TInternalState<V> = {
        value: 'dead',
        stateValue: currentState.value
    };
    const callbacksArr: Set<{
        type: TSubscriberType,
        cb: TSubscribeCb<U, V>
    }> = new Set();

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

    function _debugLogs(...msgs: any[]) {
        if (!_debug) {
            return;
        }
        console.log(...msgs);
    }

    function _runEntry(state: State<U, V, W>) {
        _debugLogs('entry::', state.value)
        _internalState.value = 'entered'
        _internalState.stateValue = state.value
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
        _debugLogs('always::', state.value)

        _internalState.value = 'living';
        _internalState.stateValue = state.value
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
        _internalState.value = 'living';
        _internalState.stateValue = state.value

        const { callback: service } = _getStateConfig(state);
        const cleanUpEffects = service(_context, send);
        _cleanUpEffectsQueue.push(cleanUpEffects);
        _runAfter(state)
    }

    function _runAsyncService(state: State<U, V, W>) {
        _debugLogs('async::', state.value)
        _internalState.value = 'living';
        _internalState.stateValue = state.value;

        const { asyncCallback: asyncService, stateJSON } = _getStateConfig(state);
        const onDoneActionEvent = Reflect.ownKeys(stateJSON)
            .find(el => typeof el === 'symbol' && el.description === '##onDone##')
        const onErrorActionEvent = Reflect.ownKeys(stateJSON)
            .find(el => typeof el === 'symbol' && el.description === '##onError##')
        return asyncService(_context)
            .catch(() => {
                _next(state, onErrorActionEvent)
            })
            .then((data: any) => {
                _debugLogs('asyncServiceRun::', state.value, 'internalStateVal::', _internalState.stateValue)
                _next(state, onDoneActionEvent, data)
            })
    }

    function _runAfter(state: State<U, V, W>) {
        _debugLogs('after::', state.value)
        _internalState.value = 'living'
        const { delay, stateEventsMap, stateJSON } = _getStateConfig(state);
        const afterJSON = stateJSON['##after##'];
        if (!afterJSON || !delay) {
            return _runAsyncService(state)
        }
        const { target, cond, isSetByDefault } = afterJSON;
        if (cond(_context)) {
            const effects = stateEventsMap.get('##after##')?.stateEventCollection ?? [];
            const delayTime = typeof delay === 'function' ? delay(_context) : delay;
            const _timerId = setTimeout(() => {
                _runEffects(effects, '##after##')
                if (!isSetByDefault) {
                    const nextState = states[target]
                    _runExit(state, nextState)
                }
            }, delayTime);
            const cleanUpEffect = () => clearTimeout(_timerId)
            _cleanUpEffectsQueue.push(cleanUpEffect)
        }
        return _runAsyncService(state)
    }

    function _runMasterActiveListener(state: State<U, V, W>, actionType: string | symbol, data: Record<string, any>) {
        _internalState.value = 'living'
        _debugLogs('master active listener::', state.value, 'act::', actionType)
        const flag = _validate(state);
        if (!flag) {
            _debugLogs('::invalidated::')
            return;
        }
        // const { stateEventsMap, stateJSON } = _getStateConfig(state);
        const eventJSON = masterStateJSON[actionType];
        if (!eventJSON) {
            return _runActiveListener(state, actionType, data);
        }
        const { target, cond, isSetByDefault } = eventJSON;
        if (cond(_context)) {
            const effects = masterStateEventsMap.get(actionType)?.stateEventCollection ?? [];
            _runEffects(effects, actionType, data)
            if (target == null) {
                return _runActiveListener(state, actionType, data)
            }
            const nextState = states[target]
            if (!isSetByDefault) {
                return _runExit(state, nextState)
            }
        }
    }


    function _runActiveListener(state: State<U, V, W>, actionType: string | symbol, data: Record<string, any>) {
        _internalState.value = 'living'
        _debugLogs('active listener::', state.value, 'act::', actionType)
        const flag = _validate(state);
        if (!flag) {
            _debugLogs('::invalidated::')
            return;
        }
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
        _internalState.value = 'exited';
        _debugLogs('exit::', state.value)
        _debugLogs('::------::')
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

    function _validate(state: State<U, V, W>) {
        return (state.value === currentState.value)
    }

    function _next(nextState: State<U, V, W>, actionType: string | symbol = '', actionData: Record<string, any> = {}) {
        _debugLogs('next::', nextState.value, "act::", actionType)
        if (_internalState.value === 'dead') {
            _setIsStarted(true)
            return _runEntry(nextState)
        }
        else if (_internalState.value === 'exited') {
            return _runEntry(nextState)
        }
        else if (_internalState.value === 'living') {
            return _runMasterActiveListener(nextState, actionType, actionData)
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
        callbacksArr.add({ type, cb });
        return function unsubscribe() {
            callbacksArr.delete({ type, cb })
        }
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