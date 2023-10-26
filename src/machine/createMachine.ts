import { MachineConfig } from "./MachineConfig";
import { State } from "./State";
import { TDefaultContext, TStateEvent } from "./types";

type TCurrentState<U> = {
    value: string;
    context: U
}


// TODO: May be create a ExecutableState Class that takes instance of class and runs enter, exit and interim states inside it

export function createMachine<U extends TDefaultContext>(config: MachineConfig<U>): [TCurrentState<U>, (actionType: string) => void] {
    const { states, initialState, context: initialContext } = config;
    let _currentState = initialState
    let _context = initialContext;
    let cleanupEffects = () => { };
    let timerId = -1;
    const currentState: TCurrentState<U> = {
        value: _currentState.value,
        context: _context
    }

    const _updateContext = (newContext: U) => {
        _context = { ...newContext }
        currentState.context = _context;
    }

    function _updateState(nextState: State<U>) {
        _currentState = nextState;
        currentState.value = _currentState.value;
        const nextAction = _currentState.stateEventsMap.get('after')
        const delay = _currentState.delay;
        if (nextAction) {
            timerId = setTimeout(() => send('after'), delay)
        }
        cleanupEffects = _currentState.callback(_context, send);
    }

    function _executeActions(action: TStateEvent<U>, actionType: string) {
        const { type, callback } = action;
        if (type === 'updateContext') {
            const newContext = callback({ context: _context, event: { type: actionType } });
            _updateContext(newContext);
        }
        else if (type === 'fireAndForget') {
            callback({ context: _context, event: { type: actionType } });
        }
    }

    function send(actionType: string) {
        const nextStateVal = _currentState.stateMap.get(actionType);
        if (nextStateVal == undefined) {
            console.warn(`Action -> ${actionType} does not seem to be configured for the state -> ${_currentState.value}`);
        }
        else {
            cleanupEffects();
            clearTimeout(timerId)
            const nextState = states[nextStateVal];
            const eventsCollection = _currentState.stateEventsMap.get(actionType)?.stateEventCollection ?? [];
            eventsCollection.forEach(event => _executeActions(event, actionType));
            _updateState(nextState);
        }
    }
    return [currentState, send];
}