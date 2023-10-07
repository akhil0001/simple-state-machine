
interface IDipsatchProps {
    type: string,
    data: object;
}


interface IStateValue {
    on?: Record<string, { target: string }>
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
export const createMachine = ({ states, initial }: ICreateMachineProps): [currentState: string, dispatch: () => (props: IDipsatchProps) => void] => {
    console.log(states);
    const currentState = initial;
    const dispatch = () => ({ type, data }: IDipsatchProps) => console.log(type, data);
    return [currentState, dispatch]
}

const [state, send] = createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgAoBbAQwGMALASwzAEp8QAHLWKgFyqw0YA9EAtADZ0AT0FDkaEMXLVadAHRUIAGzCMWbTtz6IALACYxiABwBGRQFYADHZsB2IedM2AzPoCcUqUA */
    states: {
        idle: {}
    },
    initial: 'idle'
})