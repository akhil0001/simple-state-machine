/* eslint-disable @typescript-eslint/no-explicit-any */
import { MachineConfig } from "./MachineConfig";
import { State } from "./State";
import { TDefaultContext, TDefaultStates, TStateEvent } from "./types";

type TCurrentState<U, V extends TDefaultStates> = {
    value: V[number];
    history: V[number];
    context: U
}

type TSubscribeCb<U, V extends TDefaultStates> = (state: TCurrentState<U, V>) => any

type TCreateMachineReturn<U, V extends TDefaultStates> = {
    state: TCurrentState<U, V>;
    send: (actionType: string, data?: Record<string, any>) => void;
    subscribe: (type: TSubscriberType, cb: TSubscribeCb<U, V>) => void;
    start: () => void
}

type TInternalState = 'entered' | 'living' | 'exited' | 'dead'

type TSubscriberType = 'allChanges' | 'stateChange' | 'contextChange'

// TODO: May be create a ExecutableState Class that takes instance of class and runs enter, exit and interim states inside it

export function createMachine<U extends TDefaultContext, V extends TDefaultStates>(config: MachineConfig<U, V>): TCreateMachineReturn<U, V> {
    const { states, context: initialContext } = config;
    let _context = initialContext;
    const initialStateValue: keyof typeof states = Object.keys(states)[0];
    let _currentState = states[initialStateValue]
    const currentState = {
        value: _currentState.value,
        history: _currentState.value,
        context: _context // TODO: Should deep clone this
    }

    let isStarted = false;
    let _internalState: TInternalState = 'dead';
    let _timerId = -1;
    let callbacksArr: {
        type: TSubscriberType,
        cb: TSubscribeCb<U, V>
    }[] = [];

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

    function _setCurrentState(newState: State<U, V>) {
        currentState.history = _currentState.value;
        _currentState = newState;
        currentState.value = newState.value;
        _runSubscriberCallbacks('stateChange')
    }

    function _runEffects(effects: TStateEvent<U>[], actionType: string | symbol, data: Record<string, any> = {}) {
        effects.forEach(effect => {
            const { type, callback } = effect;
            if (type === 'updateContext') {
                const newContext = callback(_context, { type: actionType, data })
                _setContext(newContext)
            }
            if (type === 'fireAndForget') {
                callback(_context, { type: actionType, data })
            }
        })
    }

    function _runEntry(state: State<U, V>) {
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

    function _runAlways(state: State<U, V>) {
        _internalState = 'living';
        const { stateJSON, stateEventsMap } = _getStateConfig(state);
        const alwaysJSONArr = Reflect.ownKeys(stateJSON)
            .filter(val => {
                return typeof val === 'symbol' && val.description === '##always##'
            });

        if (alwaysJSONArr.length === 0) {
            return _runAfter(state);
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

        return _runAfter(state)
    }

    function _runAfter(state: State<U, V>) {
        _internalState = 'living'
        const { delay, stateEventsMap, stateJSON } = _getStateConfig(state);
        const afterJSON = stateJSON['##after##'];
        if (!afterJSON || !delay) {
            return;
        }
        const { target, cond, isSetByDefault } = afterJSON;
        if (cond(_context)) {
            const effects = stateEventsMap.get('##after##')?.stateEventCollection ?? [];
            _timerId = setTimeout(() => {
                _runEffects(effects, '##after##')
                if (!isSetByDefault) {
                    const nextState = states[target]
                    _runExit(state, nextState)
                }
            }, delay);
        }
    }

    function _runLive(state: State<U, V>, actionType: string, data: Record<string, any>) {
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

    function _runExit(state: State<U, V>, nextState: State<U, V>) {
        _internalState = 'exited';
        clearTimeout(_timerId)
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

    function _next(nextState: State<U, V>, actionType: string = '', data: Record<string, any> = {}) {
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

    function _getStateConfig(state: State<U, V>) {
        return state.getConfig()
    }

    function send(actionType: string, data: Record<string, any> = {}) {
        if (!_getIsStarted()) {
            console.warn('start the machine using .start method before sending the events');
            return;
        }
        _next(_currentState, actionType, data)
    }
    function subscribe(type: TSubscriberType, cb: TSubscribeCb<U, V>) {
        callbacksArr = [...callbacksArr, { type, cb }]
    }
    function start() {
        _next(_currentState)
    }

    return { state: currentState, send, subscribe, start };
}