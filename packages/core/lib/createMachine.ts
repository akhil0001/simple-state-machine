/* eslint-disable @typescript-eslint/no-explicit-any */
import { TStateJSONPayload } from "./Action";
import { MachineConfig } from "./MachineConfig";
import { State, TStateJSON } from "./State";
import { TStates } from "./internalTypes";
import { IDefaultEvent, TAfterCallback, TCurrentState, TDefaultContext, TDefaultStates, TStateEvent } from "./types";
import { deepEqual } from "./utils";

// types
type TSubscribeCb<U extends TDefaultStates, V> = (state: TCurrentState<U, V>, actionType?: string) => any

export type TSubscribe<U extends TDefaultStates, V> = (cb: TSubscribeCb<U, V>) => () => void;

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

type TCreateMachineReturn<U extends TDefaultStates, V, W extends IDefaultEvent> = {
    id: Symbol;
    state: TCurrentState<U, V>;
    send: (action: { type: W[number], data?: Record<string, any> } | W[number]) => void;
    subscribe: TSubscribe<U, V>
    start: () => void;
    mermaidInspect: () => string;
}

type TInternalStateEnum = 'entered' | 'living' | 'exited' | 'dead' | 'subscribersNotified';
type TInternalState<V extends TDefaultStates> = {
    value: TInternalStateEnum,
    stateValue: V[number]
}

type TAction<W extends IDefaultEvent> = { type: W[number], data?: Record<string, any> } | W[number]

type TEventsQueue<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent> = {
    currentState: TStates<U, V, W>[U[number]],
    action: TAction<W>
}[]

// functions
export function createMachine<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>, context: Partial<V> = {} as V, debug: boolean = false): TCreateMachineReturn<U, V, W> {
    const { states, context: initialContext, stateJSON: masterStateJSON, id } = machineConfig.getConfig();
    let _context = { ...initialContext, ...context };
    const initialStateValue: keyof typeof states = Object.keys(states)[0];
    let _currentState = states[initialStateValue]
    const _debug = debug;
    const currentState = {
        value: initialStateValue,
        history: initialStateValue,
        context: _context // TODO: Should deep clone this
    }

    let isStarted = false;
    const _internalState: TInternalState<U> = {
        value: 'dead',
        stateValue: currentState.value
    };
    const callbacksArr: Set<TSubscribeCb<U, V>> = new Set();

    const eventsQueue: TEventsQueue<U, V, W> = [];

    let _cleanUpEffectsQueue: Array<() => any> = [];

    function _setIsStarted(value: boolean) {
        isStarted = value;
    }

    function _getIsStarted() {
        return isStarted;
    }

    function _setContext(newContext: V, whoCalled: string) {
        if (deepEqual(_context, newContext)) {
            return;
        }
        _context = { ...newContext };
        currentState.context = _context;
        _debugLogs('setContext:: ', whoCalled, ' called setContext')
        _runSubscriberCallbacks(whoCalled)
    }

    function _setCurrentState(newState: State<U, V, W>) {
        const { value: newStateValue } = _getStateConfig(newState)
        const { value: currentStateValue } = _getStateConfig(_currentState)
        if (newStateValue === currentStateValue) {
            return;
        }
        currentState.history = currentStateValue;
        _currentState = newState;
        currentState.value = newStateValue;
        _runSubscriberCallbacks('allChanges')
    }

    function _runEffects(effects: TStateEvent<V, W>[], actionType: W[number] | symbol, data: Record<string, any> = {}) {
        let tempContext = {};
        const currentContext = Object.freeze(_context)
        effects.forEach(effect => {
            const { type, callback } = effect;
            if (type === 'updateContext') {
                const newContext = callback(currentContext, { type: actionType, data })
                tempContext = { ...tempContext, ...newContext }
            }
            if (type === 'fireAndForget') {
                callback(_context, { type: actionType, data })
            }
        })
        return tempContext;
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

    function _findObjThatMatchDescription(description: string, stateJSON: TStateJSON<V, U, W>) {
        let result: TStateJSONPayload<V, U, W>[] = [];
        Reflect.ownKeys(stateJSON).forEach(el => {
            if (typeof el === 'symbol' && el.description === description) {
                result.push(stateJSON[el] as unknown as TStateJSONPayload<V, U, W>)
            }
        })
        return result.flat();
    }

    function _runEntry(state: State<U, V, W>) {
        const { stateJSON, value } = _getStateConfig(state);
        _debugLogs('entry::', value)
        _internalState.value = 'entered'
        _internalState.stateValue = value
        _setCurrentState(state)
        const enteredJSONArr = _findObjThatMatchDescription('##enter##', stateJSON)
        if (enteredJSONArr.length === 0) {
            return _runAlways(state);

        }
        let internalContext = _context;
        enteredJSONArr.forEach(enteredJSON => {
            const { target, cond, event } = enteredJSON;
            if (cond(_context)) {
                const effects = event.stateEventCollection ?? [];
                const tempContext = _runEffects(effects, '##enter##');
                internalContext = { ...internalContext, ...tempContext }
                if (target !== currentState.value) {
                    const nextState = states[target];
                    _setContext(internalContext, 'entry')
                    return _runExit(state, nextState)
                }
            }
        })
        _setContext(internalContext, 'entry')
        return _runAlways(state);
    }

    function _runAlways(state: State<U, V, W>) {
        const { value } = _getStateConfig(state)
        _debugLogs('always::', value)

        _internalState.value = 'living';
        _internalState.stateValue = value
        const { stateJSON } = _getStateConfig(state);
        const alwaysJSONArr = _findObjThatMatchDescription('##always##', stateJSON)

        if (alwaysJSONArr.length === 0) {
            return _runService(state);
        }
        let internalContext = _context;
        // note: use every instead of forEach to break once always condition is met
        alwaysJSONArr.every((alwaysJSON) => {
            const { target, cond, isSetByDefault, event } = alwaysJSON;
            if (cond(_context)) {
                const effects = event.stateEventCollection ?? [];
                const tempContext = _runEffects(effects, '##always##');
                internalContext = { ...internalContext, ...tempContext }
                if (!isSetByDefault) {
                    const nextState = states[target];
                    _setContext(internalContext, 'always')
                    return (_runExit(state, nextState), false);
                }
            }
            return true;
        });
        _setContext(internalContext, 'always')
        return _runService(state)
    }

    function _runService(state: State<U, V, W>) {
        _internalState.value = 'living';
        const { value } = _getStateConfig(state)
        _internalState.stateValue = value

        const { callback: service } = _getStateConfig(state);
        let cleanUpEffects = service(_context, send);
        if (typeof cleanUpEffects !== "function") {
            cleanUpEffects = () => { }
        }
        _cleanUpEffectsQueue.push(cleanUpEffects);
        _runAfter(state)
    }

    function _runAsyncService(state: State<U, V, W>) {
        const { value } = _getStateConfig(state)
        _debugLogs('async::', value)
        _internalState.value = 'living';
        _internalState.stateValue = value;

        const { asyncCallback: asyncService } = _getStateConfig(state);

        return asyncService(_context)
            .catch(() => {
                _internalState.value = 'living';
                _next(state, '##onError##')
            })
            .then((data: any) => {
                _internalState.value = 'living';
                _debugLogs('asyncServiceRun::', value, 'internalStateVal::', _internalState.stateValue)
                _next(state, '##onDone##', data)
            })
    }

    function _runAfter(state: State<U, V, W>) {
        const { value } = _getStateConfig(state)
        _debugLogs('after::', value)
        _internalState.value = 'living'
        const { stateJSON } = _getStateConfig(state);

        const afterJSONArr = _findObjThatMatchDescription('##after##', stateJSON)

        if (afterJSONArr.length === 0) {
            return _runAsyncService(state);
        }
        let internalContext = _context
        afterJSONArr.forEach(afterJSON => {
            const { target, cond, isSetByDefault, delay, event } = afterJSON;
            if (cond(_context)) {
                const effects = event.stateEventCollection ?? [];
                const delayTime = typeof delay === 'function' ? delay(_context) : delay;
                const _timerId = setTimeout(() => {
                    const _flag = _validate(state);
                    if (!_flag) {
                        _debugLogs('::after effect invalidated::');
                        return;
                    }
                    const tempContext = _runEffects(effects, '##after##')
                    internalContext = { ...internalContext, ...tempContext }
                    if (!isSetByDefault) {
                        const nextState = states[target]
                        _setContext(internalContext, 'after')
                        _runExit(state, nextState)
                    }
                }, delayTime);
                const cleanUpEffect = () => clearTimeout(_timerId)
                _cleanUpEffectsQueue.push(cleanUpEffect)
            }
        })
        _setContext(internalContext, 'after')
        return _runAsyncService(state)
    }

    function _runMachineActiveListener(state: State<U, V, W>, actionType: string, data: Record<string, any>) {
        _internalState.value = 'living';
        const { value } = _getStateConfig(state)
        _debugLogs('machine active listener::', value, 'act::', actionType, "state:: ", value, "current State:: ", currentState.value);
        const flag = _validate(state)
        if (!flag) {
            _debugLogs('::invalidated::');
            _internalState.value = 'subscribersNotified';
            return;
        }
        const eventJSONArr = _findObjThatMatchDescription(actionType, masterStateJSON);
        if (eventJSONArr.length === 0) {
            _debugLogs("machine active listener:: ", value, "no events mapped to masterState")
            return _runActiveListener(state, actionType, data)
        }
        let internalContext = _context;
        eventJSONArr.forEach(eventJSON => {
            const { target, cond, isSetByDefault, event } = eventJSON;
            if (cond(_context)) {
                const effects = event.stateEventCollection ?? [];
                _debugLogs('effects::', effects, 'act::', actionType)
                const tempContext = _runEffects(effects, actionType, data)
                internalContext = { ...internalContext, ...tempContext, }
                const nextState = states[target]
                if (!isSetByDefault) {
                    _setContext(internalContext, 'machineActListener')
                    return _runExit(state, nextState)
                }
            }
        })
        _setContext(internalContext, 'machineActListener')
        return _runActiveListener(state, actionType, data)
    }


    function _runActiveListener(state: State<U, V, W>, actionType: string, data: Record<string, any>) {
        _internalState.value = 'living'
        const { value } = _getStateConfig(state)
        _debugLogs('active listener::', value, 'act::', actionType)
        const flag = _validate(state);
        if (!flag) {
            _debugLogs('::invalidated::');
            _internalState.value = 'subscribersNotified';
            return;
        }
        const { stateJSON } = _getStateConfig(state);
        const eventJSONArr = _findObjThatMatchDescription(actionType, stateJSON)
        if (eventJSONArr.length === 0) {
            _internalState.value = 'subscribersNotified';
            checkForNext();
            return;
        }
        let internalContext = _context;
        eventJSONArr.forEach(eventJSON => {
            const { target, cond, isSetByDefault, event } = eventJSON;
            if (cond(_context)) {
                const effects = event.stateEventCollection ?? [];
                _debugLogs('effects::', effects, 'act::', actionType)
                const tempContext = _runEffects(effects, actionType, data)
                internalContext = { ...internalContext, ...tempContext, }
                const nextState = states[target]
                if (!isSetByDefault) {
                    _setContext(internalContext, actionType)
                    return _runExit(state, nextState)
                }
            }
        })
        _internalState.value = 'subscribersNotified';
        _setContext(internalContext, actionType)
        checkForNext();
    }

    function _runExit(state: State<U, V, W>, nextState: State<U, V, W>) {
        _internalState.value = 'exited';
        const { value } = _getStateConfig(state)
        _debugLogs('exit::', value)
        _debugLogs('::------::')
        _runCleanupEffects()
        const { stateJSON } = _getStateConfig(state);
        const exitJSONArr = _findObjThatMatchDescription('##exit##', stateJSON)

        if (exitJSONArr.length === 0) {
            _next(nextState)
            return;
        }
        let internalContext = _context
        exitJSONArr.forEach(exitJSON => {
            const effects = exitJSON.event.stateEventCollection ?? [];
            const tempContext = _runEffects(effects, '##exit##')
            internalContext = { ...internalContext, ...tempContext }
        })
        _setContext(internalContext, 'exit')
        _next(nextState)
        return;
    }

    function _runSubscriberCallbacks(actionType?: string) {
        callbacksArr.forEach(callback => {
            callback(currentState, actionType)
        })
    }

    function _validate(state: State<U, V, W>) {
        const { value } = _getStateConfig(state)
        return (value === currentState.value)
    }

    function _next(nextState: State<U, V, W>, actionType: string = '', actionData: Record<string, any> = {}) {
        const { value: nextStateValue } = _getStateConfig(nextState)
        _debugLogs('next::', nextStateValue, "act::", actionType, 'internalState:: ', _internalState.value, "currentState:: ", currentState.value)
        if (_internalState.value === 'dead') {
            _setIsStarted(true)
            return _runEntry(nextState)
        }
        else if (_internalState.value === 'exited') {
            return _runEntry(nextState)
        }
        else if (_internalState.value === 'living') {
            return _runMachineActiveListener(nextState, actionType, actionData)
        }
    }


    function _getStateConfig(state: State<U, V, W>) {
        return state.getConfig()
    }

    function send(action: TAction<W>) {
        if (!_getIsStarted()) {
            console.warn('start the machine using .start method before sending the events');
            return;
        }
        eventsQueue.push({
            currentState: _currentState,
            action
        });
        checkForNext();
    }

    function checkForNext() {
        const event = eventsQueue[0];
        if (!event || _internalState.value !== 'subscribersNotified') {
            _debugLogs('checkForNext:: invalidated', eventsQueue, _internalState.value)
            return;
        }
        eventsQueue.shift()
        _debugLogs('checkForNext:: moving ahead with ', event.action)
        _internalState.value = 'living'
        if (typeof event?.action === 'object')
            _next(event.currentState, event.action.type, event.action?.data)
        else
            _next(event.currentState, event.action)
    }

    function subscribe(cb: TSubscribeCb<U, V>) {
        callbacksArr.add(cb);
        return function unsubscribe() {
            callbacksArr.delete(cb)
        }
    }

    function start() {
        if (isStarted) {
            return;
        }
        _runSubscriberCallbacks('allChanges')
        _next(_currentState)
    }

    function _mayBeFunction(prop: number | ((...args: any[]) => any)) {
        if (typeof prop === 'function') {
            return prop
        }
        return () => prop;
    }

    function _refineActionName(action: string, delay: number | TAfterCallback<V>) {
        let refinedActionName = action.split('#')
            .join('')
        if (refinedActionName === 'after') {
            refinedActionName = refinedActionName + ' ' + _mayBeFunction(delay)(_context) + 'ms'
        }
        return refinedActionName;
    }

    function mermaidInspect() {
        let stateChartStr = `
            stateDiagram-v2
            classDef currentState fill:#f00,color:white,font-weight:bold,stroke-width:2px,stroke:yellow
            classDef machineTransitions fill:#01f,color:white,padding-left:80px,padding-right:80px
                [*] --> ${initialStateValue} 
        `
        for (const state in states) {
            const _state: U[number] = state;
            const { stateJSON } = _getStateConfig(states[_state]);
            const combinedJSON = { ...stateJSON }
            Reflect.ownKeys(combinedJSON)
                .forEach(el => {
                    const actionName = typeof el === 'symbol' ? el.description ?? '' : el;
                    const refinedActionName = _refineActionName(actionName, 0) // FIXME: get the actual delay param
                    // const target = combinedJSON[el].target; //FIXME: get the actual target
                    const target = ''
                    stateChartStr = `
                    ${stateChartStr}
                    ${state} --> ${target}: ${refinedActionName}
                `
                })
        }

        stateChartStr = `
           ${stateChartStr}
            class ${currentState.value} currentState
            class Machine machineTransitions
        `;
        return stateChartStr
    }

    return { state: currentState, send, subscribe, start, mermaidInspect, id };
}