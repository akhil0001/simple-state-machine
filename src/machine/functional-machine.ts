// TODO: Fix all types and names
type TStates<T extends PropertyKey[], U> = {
    [TIndex in T[number]]: State<U>
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

// type TStateEventArray = {
//     fireAndForgetEvents: Array<({ context }: { context: TContext }) => void>;
//     updateContextEvents: Array<({ context, event }: { context: TContext, event: TEvent }) => void>
// }

type TStateEventCollection<TTContext> = {
    type: 'fireAndForget' | 'updateContext',
    callback: ({ context, event }: { context: TTContext, event: TEvent }) => void
}[]
class StateEvent<TTContext> {
    stateEventCollection: TStateEventCollection<TTContext> = []
    constructor() {
        this.stateEventCollection = [];
    }
    fireAndForget(cb: ({ context, event }: { context: TTContext, event: TEvent }) => void) {

        // const oldStateEventMapFireAndForgetEvents = this.stateEventMap.fireAndForgetEvents;
        // this.stateEventMap.fireAndForgetEvents = [...oldStateEventMapFireAndForgetEvents, cb];
        const oldStateEventCollection = this.stateEventCollection;
        this.stateEventCollection = [...oldStateEventCollection, { type: 'fireAndForget', callback: cb }]
        return this
    }
    updateContext(cb: () => void) {
        // const oldStateEventMapUpdateContextEvents = this.stateEventMap.updateContextEvents;
        // this.stateEventMap.updateContextEvents = [...oldStateEventMapUpdateContextEvents, cb];
        const oldStateContextCollection = this.stateEventCollection;
        this.stateEventCollection = [...oldStateContextCollection, { type: 'updateContext', callback: cb }]
        return this
    }
}
class State<TTContext> {
    value: string = '';
    #stateEvent: StateEvent<TTContext> = new StateEvent<TTContext>();
    stateMap: Map<string, string> = new Map();
    stateEventsMap: Map<string, StateEvent<TTContext>> = new Map();
    #chainedActionType: string = '';
    constructor(val: string) {
        this.value = val;
    }
    on(actionType: string) {
        const stateEvent = new StateEvent<TTContext>();
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

class MachineConfig<TTContext extends TContext> {
    states: TStates<string[], TTContext> = {};
    context: TTContext;
    initialState: State<TTContext> = new State('init');

    constructor(newContext: TTContext) {
        this.context = { ...newContext ?? {} };
    }

    addStates<T extends string>(states: T[]): TStates<T[], TTContext> {
        const newStates = states.reduce((acc, curr) => {
            return { ...acc, [curr]: new State<TTContext>(curr) };
        }, this.states);
        this.states = newStates;
        return newStates
    }

}
interface SomeContext {
    id: number
}
const machineConfig = new MachineConfig<SomeContext>({
    id: 0
});

const { idle, fetching, error } = machineConfig.addStates(['idle', 'fetching', 'error']);
machineConfig.initialState = (idle);

idle.on('fetch').moveTo('fetching').fireAndForget(({ context }) => context.id).fireAndForget(() => console.log('2'))
fetching.on('poll').fireAndForget(() => console.log('received a poll event'))
fetching.on('success').moveTo('idle');
error.on('fetch').moveTo('idle')
// states.fetching.on('error').moveTo('error')

type TCurrentState = {
    value: string;
}

function createMachine<U extends TContext>(config: MachineConfig<U>): [TCurrentState, (actionType: string) => void] {
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

const [state, send] = createMachine<SomeContext>(machineConfig);
console.log(state.value)
send('fetch')
send('poll')
send('success')
console.log(state.value)
