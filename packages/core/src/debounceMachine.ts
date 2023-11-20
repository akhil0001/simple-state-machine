import { MachineConfig, TAsyncCallback, createStates } from "../lib";
import { createEvents } from "../lib/MachineConfig";


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

export const debounceMachine = new MachineConfig<IContext, typeof states, typeof events>(states, {
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
const { fetching, idle, debouncing } = debounceMachine.getStates()

debounceMachine.on('updateTodoValue')
    .moveTo('debouncing')
    .updateContext((context, event) => ({ ...context, todoValue: event.data?.todoValue ?? context.todoValue }))


debouncing.after(context => context.delay)
    .moveTo('fetching')


fetching.invokeAsyncCallback(fetchingUrl)
    .onDone()
    .moveTo('idle')
    .updateContext((context, event) => ({ ...context, data: event.data?.response ?? null }))
    .fireAndForget(console.log)

fetching.invokeAsyncCallback(fetchingUrl)
    .onError()
    .moveTo('error')
