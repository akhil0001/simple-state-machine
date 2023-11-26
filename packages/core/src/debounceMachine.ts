import { MachineConfig, TAsyncCallback, assign, createStates } from "../lib";
import { createEvents } from "../lib/MachineConfig";
import './timerMachine'

const states = createStates('idle', 'fetching', 'debouncing', 'error')
const events = createEvents('updateTodoValue')

interface IAPIResponse {
    userId: string;
    title: string;
}

interface IContext {
    url: string;
    data: IAPIResponse | null,
    todoValue: string;
    delay: number
}

export const debounceMachine = new MachineConfig<typeof states, IContext, typeof events>(states, {
    url: '',
    data: null,
    todoValue: "1",
    delay: 500
}, events)

const fetchingUrl: TAsyncCallback<IContext> = (context) => {
    const { url } = context
    return fetch(url + context.todoValue)
        .then(res => res.json())
        .then(data => ({ response: data }))
}

const updateTodoValue = assign<IContext, typeof events>({
    todoValue: (_, event) => event.data.todoValue
})

const { fetching, debouncing } = debounceMachine.getStates()

debounceMachine.on('updateTodoValue').moveTo('debouncing').updateContext(updateTodoValue)

debouncing.after(context => context.delay)
    .moveTo('fetching')

fetching.invokeAsyncCallback(fetchingUrl)
    .onDone()
    .moveTo('idle')
    .updateContext({ data: (_, event) => event.data.response })
    .fireAndForget(console.log)

fetching.invokeAsyncCallback(fetchingUrl)
    .onError()
    .moveTo('error')
