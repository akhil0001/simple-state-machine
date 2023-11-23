/* eslint-disable @typescript-eslint/no-explicit-any */
import { TStateJSONPayload } from "./Action";
import { MachineConfig } from "./MachineConfig";
import { State, TStateJSON } from "./State";
import { IDefaultEvent, TAfterCallback, TCurrentState, TDefaultContext, TDefaultStates, TStateEvent } from "./types";

// types
type TSubscribeCb<U extends TDefaultStates, V> = (state: TCurrentState<U, V>) => any

export type TSubscribe<U extends TDefaultStates, V> = (type: TSubscriberType, cb: TSubscribeCb<U, V>) => () => void;

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
    state: TCurrentState<U, V>;
    send: (action: { type: W[number], data?: Record<string, any> } | W[number]) => void;
    subscribe: TSubscribe<U, V>
    start: () => void;
    mermaidInspect: () => string;
}

type TInternalStateEnum = 'entered' | 'living' | 'exited' | 'dead';
type TInternalState<V extends TDefaultStates> = {
    value: TInternalStateEnum,
    stateValue: V[number]
}

type TSubscriberType = 'allChanges' | 'stateChange' | 'contextChange'

// functions
export function createMachine<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>, context: Partial<V> = {} as V, debug: boolean = false): TCreateMachineReturn<U, V, W> {
    const { states, context: initialContext } = machineConfig.getConfig();
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

    function _setContext(newContext: V) {
        _context = { ...newContext };
        currentState.context = _context;
        _runSubscriberCallbacks('contextChange')
    }

    function _setCurrentState(newState: State<U, V, W>) {
        const { value: newStateValue } = _getStateConfig(newState)
        const { value: currentStateValue } = _getStateConfig(_currentState)
        currentState.history = currentStateValue;
        _currentState = newState;
        currentState.value = newStateValue;
        _runSubscriberCallbacks('stateChange')
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
        enteredJSONArr.forEach(enteredJSON => {
            const { target, cond, event } = enteredJSON;
            if (cond(_context)) {
                const effects = event.stateEventCollection ?? [];
                _runEffects(effects, '##enter##')
                if (target !== currentState.value) {
                    const nextState = states[target]
                    return _runExit(state, nextState)
                }
            }
        })

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
        // note: use every instead of forEach to break once always condition is met
        alwaysJSONArr.every((alwaysJSON) => {
            const { target, cond, isSetByDefault, event } = alwaysJSON;
            if (cond(_context)) {
                const effects = event.stateEventCollection ?? [];
                _runEffects(effects, '##always##');
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
        const { value } = _getStateConfig(state)
        _internalState.stateValue = value

        const { callback: service } = _getStateConfig(state);
        const cleanUpEffects = service(_context, send);
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
                _next(state, '##onError##')
            })
            .then((data: any) => {
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
        afterJSONArr.forEach(afterJSON => {
            const { target, cond, isSetByDefault, delay, event } = afterJSON;
            if (cond(_context)) {
                const effects = event.stateEventCollection ?? [];
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
        })
        return _runAsyncService(state)
    }

    // function _runMasterActiveListener(state: State<U, V, W>, actionType: string | symbol, data: Record<string, any>) {
    //     _internalState.value = 'living'
    //     const { value } = _getStateConfig(state)
    //     _debugLogs('master active listener::', value, 'act::', actionType)
    //     const flag = _validate(state);
    //     if (!flag) {
    //         _debugLogs('::invalidated::')
    //         return;
    //     }
    //     // const { stateEventsMap, stateJSON } = _getStateConfig(state);
    //     const eventJSON = masterStateJSON[actionType];
    //     if (!eventJSON) {
    //         return _runActiveListener(state, actionType, data);
    //     }
    //     const { target, cond, isSetByDefault } = eventJSON;
    //     if (cond(_context)) {
    //         const effects = masterStateEventsMap.get(actionType)?.stateEventCollection ?? [];
    //         _runEffects(effects, actionType, data)
    //         if (target === '##notYetDeclared##') {
    //             return _runActiveListener(state, actionType, data)
    //         }
    //         const nextState = states[target]
    //         if (!isSetByDefault) {
    //             return _runExit(state, nextState)
    //         }
    //     }
    // }


    function _runActiveListener(state: State<U, V, W>, actionType: string, data: Record<string, any>) {
        _internalState.value = 'living'
        const { value } = _getStateConfig(state)
        _debugLogs('active listener::', value, 'act::', actionType)
        const flag = _validate(state);
        if (!flag) {
            _debugLogs('::invalidated::')
            return;
        }
        const { stateJSON } = _getStateConfig(state);
        const eventJSONArr = _findObjThatMatchDescription(actionType, stateJSON)
        if (eventJSONArr.length === 0) {
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
                    _setContext(internalContext)
                    return _runExit(state, nextState)
                }
            }
        })
        _setContext(internalContext)
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

        exitJSONArr.forEach(exitJSON => {
            const effects = exitJSON.event.stateEventCollection ?? [];
            _runEffects(effects, '##exit##')
        })
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
        const { value } = _getStateConfig(state)
        return (value === currentState.value)
    }

    function _next(nextState: State<U, V, W>, actionType: string = '', actionData: Record<string, any> = {}) {
        const { value: nextStateValue } = _getStateConfig(nextState)
        _debugLogs('next::', nextStateValue, "act::", actionType)
        if (_internalState.value === 'dead') {
            _setIsStarted(true)
            return _runEntry(nextState)
        }
        else if (_internalState.value === 'exited') {
            return _runEntry(nextState)
        }
        else if (_internalState.value === 'living') {
            return _runActiveListener(nextState, actionType, actionData)
        }
    }

    function _getStateConfig(state: State<U, V, W>) {
        return state.getConfig()
    }

    function send(action: { type: W[number], data?: Record<string, any> } | W[number]) {
        if (!_getIsStarted()) {
            console.warn('start the machine using .start method before sending the events');
            return;
        }
        if (typeof action === "object")
            _next(_currentState, action.type, action?.data)
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

    return { state: currentState, send, subscribe, start, mermaidInspect };
}