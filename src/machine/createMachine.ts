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
    send: (actionType: string) => void;
    subscribe: (cb: TSubscribeCb<U, V>) => void;
    start: () => void
}

type TInternalState = 'entered' | 'living' | 'exited' | 'dead'

// TODO: May be create a ExecutableState Class that takes instance of class and runs enter, exit and interim states inside it

export function createMachine<U extends TDefaultContext, V extends TDefaultStates>(config: MachineConfig<U, V>): TCreateMachineReturn<U, V> {

    // // private variables
    // const { states, context: initialContext } = config;
    // const k: keyof typeof states = Object.keys(states)[0]
    // let _currentState = states[k]
    // let _context = initialContext;

    // // internal variables
    // let _isStarted = false;
    // let timerId = -1;
    // let cleanupEffects = () => { };
    // let callbacksArr: TSubscribeCb<U, V>[] = [];

    // // public variable
    // const currentState: TCurrentState<U, V> = {
    //     value: _currentState.value,
    //     context: _context
    // }

    // const _updateContext = (newContext: U) => {
    //     _context = { ...newContext }
    //     currentState.context = _context;
    //     _publishEventsToAllSubscribers()
    // }

    // const _publishEventsToAllSubscribers = () => {
    //     callbacksArr.forEach(cb => cb(currentState));
    // }

    // function _updateState(nextState: State<U, V>) {
    //     _currentState = nextState;
    //     currentState.value = _currentState.value;
    //     _publishEventsToAllSubscribers();
    //     const { callback, stateEventsMap } = _currentState.getConfig()
    //     const nextAction = stateEventsMap.get('after')
    //     const entryAction = stateEventsMap.get('##enter##');
    //     if (entryAction) {
    //         const eventsCollection = stateEventsMap.get('##enter##')?.stateEventCollection ?? [];
    //         eventsCollection.forEach(event => _executeActions(event, '##enter##'));
    //     }
    //     const delay = _currentState.delay;
    //     if (nextAction) {
    //         timerId = setTimeout(() => send('after'), delay)
    //     }
    //     cleanupEffects = callback(_context, send);
    // }

    // function _executeActions(action: TStateEvent<U>, actionType: string) {
    //     const { type, callback } = action;
    //     if (type === 'updateContext') {
    //         const newContext = callback(_context, { type: actionType });
    //         _updateContext(newContext);
    //     }
    //     else if (type === 'fireAndForget') {
    //         callback(_context, { type: actionType });
    //     }
    // }

    // function send(actionType: string) {
    //     if (!_isStarted) {
    //         console.warn('start the machine using .start method before sending the events');
    //         return;
    //     }
    //     const { stateEventsMap, stateJSON } = _currentState.getConfig()
    //     const guard = stateJSON[actionType].cond;
    //     const shouldMoveToNextFlag = guard(_context)
    //     if (!shouldMoveToNextFlag) {
    //         return null;
    //     }
    //     const nextStateVal = stateJSON[actionType].target
    //     const isSetByDefault = stateJSON[actionType].isSetByDefault
    //     if (nextStateVal == undefined) {
    //         console.warn(`Action -> ${actionType} does not seem to be configured for the state -> ${_currentState.value}`);
    //     }
    //     else {
    //         cleanupEffects();
    //         clearTimeout(timerId)
    //         const nextState = states[nextStateVal];
    //         const eventsCollection = stateEventsMap.get(actionType)?.stateEventCollection ?? [];
    //         eventsCollection.forEach(event => _executeActions(event, actionType));
    //         if (!isSetByDefault) {
    //             const eventsCollection = stateEventsMap.get('##exit##')?.stateEventCollection ?? [];
    //             eventsCollection.forEach(event => _executeActions(event, '##exit##'));
    //             _updateState(nextState as State<U, V>);
    //         }
    //     }
    // }

    // function subscribe(cb: TSubscribeCb<U, V>) {
    //     callbacksArr = [...callbacksArr, cb]
    // }

    // function start() {
    //     _isStarted = true;
    //     _updateState(_currentState)
    // }
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
    let callbacksArr: TSubscribeCb<U, V>[] = [];

    function _setIsStarted(value: boolean) {
        isStarted = value;
    }

    function _getIsStarted() {
        return isStarted;
    }

    function _setContext(newContext: U) {
        _context = { ...newContext };
        currentState.context = _context;
        _runSubscriberCallback()
    }

    function _setCurrentState(newState: State<U, V>) {
        currentState.history = _currentState.value;
        _currentState = newState;
        currentState.value = newState.value;
        _runSubscriberCallback()
    }

    function _runEffects(effects: TStateEvent<U>[], actionType: string | symbol) {
        effects.forEach(effect => {
            const { type, callback } = effect;
            if (type === 'updateContext') {
                const newContext = callback(_context, { type: actionType })
                _setContext(newContext)
            }
            if (type === 'fireAndForget') {
                callback(_context, { type: actionType })
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

    function _runLive(state: State<U, V>, actionType: string) {
        _internalState = 'living'
        const { stateEventsMap, stateJSON } = _getStateConfig(state);
        const eventJSON = stateJSON[actionType];
        if (!eventJSON) {
            return;
        }
        const { target, cond, isSetByDefault } = eventJSON;
        if (cond(_context)) {
            const effects = stateEventsMap.get(actionType)?.stateEventCollection ?? [];
            _runEffects(effects, actionType)
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

    function _runSubscriberCallback() {
        callbacksArr.forEach(cb => {
            cb(currentState)
        })
    }

    function _next(nextState: State<U, V>, actionType: string = '') {
        if (_internalState === 'dead') {
            _setIsStarted(true)
            _runEntry(nextState)
        }
        else if (_internalState === 'exited') {
            _runEntry(nextState)
        }
        else if (_internalState === 'living') {
            _runLive(nextState, actionType)
        }
    }

    function _getStateConfig(state: State<U, V>) {
        return state.getConfig()
    }

    function send(actionType: string) {
        if (!_getIsStarted()) {
            console.warn('start the machine using .start method before sending the events');
            return;
        }
        _next(_currentState, actionType)
    }
    function subscribe(cb: TSubscribeCb<U, V>) {
        callbacksArr = [...callbacksArr, cb]
    }
    function start() {
        _next(_currentState)
    }

    return { state: currentState, send, subscribe, start };
}