
interface IDipsatchProps {
    type: string,
    data?: object;
}

interface IInvoke {
    src: Promise,
    onDone?: {
        cb?: (data) => void;
        target?: string
    },
    onError?: {
        cb?: (data) => void;
        target?: string;
    }
}

interface IStateValue {
    on?: Record<string, { target?: string }>,
    invoke?: IInvoke;
}

type TState = Record<string, IStateValue>

// TODO: Improve my typescript skills. 
// In this interface initial should actually pick up one of the key of states and intellisense should suggest the user
interface ICreateMachineProps {
    states: TState,
    initial: keyof TState;
}

// TODO: What if JSON could be ditched and use a js syntax to deal with states
// Ex:
// const fetchMachine = createSimpleMachine('fetchMachine') ;
// const idle = fetchMachine.createState('idle')
// const loading = fetchMachine.createState('loading');
// const error = fetchMachine.createState('error');
// idle.on('fetch').moveTo('loading').act()
// const transitions 
export const createMachine = ({ states, initial }: ICreateMachineProps): [currentState: Record<'value', string>, dispatch: (props: IDipsatchProps) => void] => {
    const currentState = {
        value: initial,
        invoke: {
            src: () => { }
        }
    };
    const stateIterator = {
        next(actionName: string) {
            const currentStateValue = states[currentState.value];
            const nextState = currentStateValue.on ? currentStateValue.on[actionName].target || currentState.value : currentState.value;
            return { value: nextState, done: false }
        }
    }
    const dispatch = (props: IDipsatchProps) => {
        const { type } = props;
        currentState.value = stateIterator.next(type).value;
    }
    return [currentState, dispatch]
}

const [state, send] = createMachine({
    states: {
        idle: {
            on: {
                FETCH: {
                    target: 'loading'
                }
            }
        },
        loading: {
            invoke: {
                src: new Promise(resolve => setTimeout(() => resolve(100), 1000)),
                onDone: {
                    cb: console.log
                }
            }
        },
        error: {}
    },
    initial: 'idle'
})
console.log(state.value);
send({
    type: 'FETCH'
})

console.log(state.value);