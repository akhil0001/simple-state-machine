type TStates<T extends PropertyKey[]> = {
    [TIndex in T[number]]: State
}

type TContext = {
    [key: string]: any;
}

type TEvent = {
    type: string;
    data?: {
        [key: string]: any;
    }
}

type TStateEventMap = {
    fireAndForgetEvents: Array<({ context }: { context: TContext }) => void>;
    updateContextEvents: Array<({ context, event }: { context: TContext, event: TEvent }) => void>
}
class StateEvent {
    stateEventMap: TStateEventMap = {
        fireAndForgetEvents: [],
        updateContextEvents: []
    }
    constructor() {
        this.stateEventMap = {
            fireAndForgetEvents: [],
            updateContextEvents: []
        }
    }
    fireAndForget(cb: () => void) {
        const oldStateEventMapFireAndForgetEvents = this.stateEventMap.fireAndForgetEvents;
        this.stateEventMap.fireAndForgetEvents = [...oldStateEventMapFireAndForgetEvents, cb];
        return this
    }
    updateContext(cb: () => void) {
        const oldStateEventMapUpdateContextEvents = this.stateEventMap.updateContextEvents;
        this.stateEventMap.updateContextEvents = [...oldStateEventMapUpdateContextEvents, cb];
        return this
    }
}
class State {
    value: string = '';
    #stateEvent: StateEvent = new StateEvent('');
    stateMap: Map<string, string> = new Map();
    stateEventsMap: Map<string, StateEvent> = new Map();
    #chainedActionType: string = ''
    constructor(val: string) {
        this.value = val;
    }
    on(actionType: string) {
        const stateEvent = new StateEvent();
        this.#stateEvent = stateEvent;
        this.stateMap.set(actionType, this.value);
        this.stateEventsMap.set(actionType, this.#stateEvent);
        this.#chainedActionType = actionType;
        const fireAndForget = this.#stateEvent.fireAndForget.bind(this.#stateEvent);
        const updateContext = this.#stateEvent.updateContext.bind(this.#stateEvent);
        return { moveTo: this.#moveTo.bind(this), fireAndForget, updateContext }
    }
    #moveTo(target: string) {
        this.stateMap.set(this.#chainedActionType, target);
        const fireAndForget = this.#stateEvent.fireAndForget.bind(this.#stateEvent);
        const updateContext = this.#stateEvent.updateContext.bind(this.#stateEvent);

        return { fireAndForget: fireAndForget, updateContext }
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

states.idle.on('fetch').moveTo('fetching').fireAndForget(() => console.log('hello i am from fetching'))
states.fetching.on('poll').fireAndForget(() => console.log('received a poll event'))
// states.fetching.on('success').moveTo('idle');
// states.fetching.on('error').moveTo('error')

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
            const eventsMap = _currentState.stateEventsMap.get(actionType)?.stateEventMap;
            const events = [...(eventsMap?.fireAndForgetEvents ?? []), ...(eventsMap?.updateContextEvents ?? [])];
            events.forEach(event => event({ context: {}, event: { type: actionType } }))
            _currentState = nextState
            currentState.value = _currentState.value
        }
    }
    return [currentState, send];
}

const [state, send] = createMachine(machineConfig);
console.log(state.value)
send('fetch')
send('poll')
// send('success')
// console.log(state.value)