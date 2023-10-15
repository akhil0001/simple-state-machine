class State {
    value: string = '';
    constructor(val: string) {
        this.value = val;
    }

}
type TStates<T extends PropertyKey[]> = {
    [TIndex in T[number]]: State
}
class Machine {
    states: TStates<string[]> = {};
    context: object = {};
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

const machine = new Machine();

const states = machine.addStates(['idle', 'fetching'])


// const { idle, fetching, error } = fetchMachine.addStates(['idle', 'fetching', 'error']);

// // context

// fetchMachine.setContext({ urls: [] });

// // actions
// const setUrls = (context, event) => context;

// // services
// const fetchTodo = async () => await new Promise(res => setTimeout(res, 1000));

// // transition
// idle.on('fetch').triggers(setUrls).movesTo(fetching)
// idle.on('entry').invoke(fetchTodo)