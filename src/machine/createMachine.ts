/* eslint-disable @typescript-eslint/no-explicit-any */
import { MachineConfig } from "./MachineConfig";
import { State } from "./State";
import { TDefaultContext, TDefaultStates, TStateEvent } from "./types";

type TCurrentState<U, V extends TDefaultStates> = {
    value: V[number];
    context: U
}

type TSubscribeCb<U, V extends TDefaultStates> = (state: TCurrentState<U, V>) => any

type TCreateMachineReturn<U, V extends TDefaultStates> = {
    state: TCurrentState<U, V>;
    send: (actionType: string) => void;
    subscribe: (cb: TSubscribeCb<U, V>) => void;
    start: () => void
}


// TODO: May be create a ExecutableState Class that takes instance of class and runs enter, exit and interim states inside it

export function createMachine<U extends TDefaultContext, V extends TDefaultStates>(config: MachineConfig<U, V>): TCreateMachineReturn<U, V> {
    const { states, context: initialContext } = config;
    const k: keyof typeof states = Object.keys(states)[0]
    let _currentState = states[k]
    let _context = initialContext;
    let isStarted = false;
    let cleanupEffects = () => { };
    let timerId = -1;
    let callbacksArr: TSubscribeCb<U, V>[] = [];
    const currentState: TCurrentState<U, V> = {
        value: _currentState.value,
        context: _context
    }

    const _updateContext = (newContext: U) => {
        _context = { ...newContext }
        currentState.context = _context;
        _publishEventsToAllSubscribers()
    }

    const _publishEventsToAllSubscribers = () => {
        callbacksArr.forEach(cb => cb(currentState));
    }

    function _updateState(nextState: State<U, V>) {
        _currentState = nextState;
        currentState.value = _currentState.value;
        _publishEventsToAllSubscribers();
        const { callback, stateEventsMap } = _currentState.getConfig()
        const nextAction = stateEventsMap.get('after')
        const entryAction = stateEventsMap.get('##enter##');
        if (entryAction) {
            const eventsCollection = stateEventsMap.get('##enter##')?.stateEventCollection ?? [];
            eventsCollection.forEach(event => _executeActions(event, '##enter##'));
        }
        const delay = _currentState.delay;
        if (nextAction) {
            timerId = setTimeout(() => send('after'), delay)
        }
        cleanupEffects = callback(_context, send);
    }

    function _executeActions(action: TStateEvent<U>, actionType: string) {
        const { type, callback } = action;
        if (type === 'updateContext') {
            const newContext = callback(_context, { type: actionType });
            _updateContext(newContext);
        }
        else if (type === 'fireAndForget') {
            callback(_context, { type: actionType });
        }
    }

    function send(actionType: string) {
        if (!isStarted) {
            console.warn('start the machine using .start method before sending the events');
            return;
        }
        const { stateEventsMap, stateJSON } = _currentState.getConfig()
        const nextStateVal = stateJSON[actionType].target
        const isSetByDefault = stateJSON[actionType].isSetByDefault
        if (nextStateVal == undefined) {
            console.warn(`Action -> ${actionType} does not seem to be configured for the state -> ${_currentState.value}`);
        }
        else {
            cleanupEffects();
            clearTimeout(timerId)
            const nextState = states[nextStateVal];
            const eventsCollection = stateEventsMap.get(actionType)?.stateEventCollection ?? [];
            eventsCollection.forEach(event => _executeActions(event, actionType));
            if (!isSetByDefault) {
                const eventsCollection = stateEventsMap.get('##exit##')?.stateEventCollection ?? [];
                eventsCollection.forEach(event => _executeActions(event, '##exit##'));
                _updateState(nextState as State<U, V>);
            }
        }
    }

    function subscribe(cb: TSubscribeCb<U, V>) {
        callbacksArr = [...callbacksArr, cb]
    }

    function start() {
        isStarted = true;
        _updateState(_currentState)
    }

    return { state: currentState, send, subscribe, start };
}