import { MachineConfig } from "./MachineConfig";
import { TDefaultContext } from "./types";

type TCurrentState = {
    value: string;
}

export function createMachine<U extends TDefaultContext>(config: MachineConfig<U>): [TCurrentState, (actionType: string) => void] {
    const { states, initialState, context } = config;
    let _currentState = initialState
    const currentState: TCurrentState = {
        value: _currentState.value
    }
    const send = (actionType: string) => {
        const nextStateVal = _currentState.stateMap.get(actionType);
        if (nextStateVal == undefined) {
            console.warn(`Action -> ${actionType} does not seem to be configured for the state -> ${_currentState.value}`);
        }
        else {
            const nextState = states[nextStateVal];
            const eventsCollection = _currentState.stateEventsMap.get(actionType)?.stateEventCollection ?? [];
            eventsCollection.forEach(event => event.callback({ context, event: { type: actionType } }))
            _currentState = nextState
            currentState.value = _currentState.value
        }
    }
    return [currentState, send];
}