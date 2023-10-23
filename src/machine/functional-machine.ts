type TStates<T extends PropertyKey[]> = {
    [TIndex in T[number]]: State
}
class StateEvent {
    #value: string;
    #updateStateMap: () => void;
    constructor(val: string, updateStateMap: () => void) {
        this.#value = val;
        this.#updateStateMap = updateStateMap;
    }
    fireAndForget(cb: () => void) {
        return this
    }
    updateContext(cb: () => void) {
        return this
    }
}
class State {
    value: string = '';
    #stateEvent: StateEvent = new StateEvent('', () => { });
    stateMap: Map<string, string> = new Map();
    #chainedActionType: string = ''
    constructor(val: string) {
        this.value = val;
    }
    on(actionType: string) {
        const stateEvent = new StateEvent(this.value, () => { });
        this.#stateEvent = stateEvent;
        this.stateMap.set(actionType, this.value);
        this.#chainedActionType = actionType;
        return { moveTo: this.#moveTo.bind(this), fireAndForget: stateEvent.fireAndForget, updateContext: stateEvent.updateContext }
    }
    #moveTo(target: string) {
        this.stateMap.set(this.#chainedActionType, target);
        return this.#stateEvent;
    }

}

class MachineConfig {
    states: TStates<string[]> = {};
    context: object = {};
    initialState: State = new State('init');

    constructor() {
        this.context = {};
        this.states = {}
    }

    addStates<T extends string>(states: T[]): TStates<T[]> {
        const newStates = states.reduce((acc, curr) => {
            return { ...acc, [curr]: new State(curr) };
        }, this.states);
        this.states = newStates;
        return newStates
    }
}

const machineConfig = new MachineConfig();

const states = machineConfig.addStates(['idle', 'fetching', 'error']);
machineConfig.initialState = (states.idle);

states.idle.on('fetch').moveTo('fetching').fireAndForget(console.log).updateContext(console.log)
states.idle.on('timer').fireAndForget(console.log)
states.fetching.on('success').moveTo('idle');
states.fetching.on('error').moveTo('error')

type TCurrentState = {
    value: string;
}

const createMachine = (config: MachineConfig): [TCurrentState, (actionType: string) => void] => {
    const { states, initialState } = config;
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
            _currentState = nextState
            currentState.value = _currentState.value
        }
    }
    return [currentState, send];
}

const [state, send] = createMachine(machineConfig);
console.log(state.value)
send('fetch')
console.log(state.value)
send('success')
console.log(state.value)