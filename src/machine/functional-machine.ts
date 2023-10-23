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
    constructor(val: string) {
        this.value = val;
    }
    on(actionType: string) {
        return { moveTo: this.#moveTo.bind(this), fireAndForget: this.#fireAndForget.bind(this), updateContext: this.#updateContext.bind(this) }
    }
    #moveTo(target: string) {
        const stateEvent = new StateEvent(this.value, () => { });
        return stateEvent;
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
        }, this.states)
        return newStates
    }
}

const machineConfig = new MachineConfig();

const states = machineConfig.addStates(['idle', 'fetching', 'error']);
machineConfig.initialState = (states.idle);

states.idle.on('fetch').moveTo('fetching').fireAndForget(console.log).updateContext(console.log)

const createMachine = (config: MachineConfig) => {
    const { states, initialState } = config;
    const currentState = initialState;


    const send = (actionType: string) => {
        currentState.on()
    }

    return [currentState, send];

}