import { MachineConfig } from "../lib/MachineConfig";
import { TAsyncCallback } from "../lib/types";

type TStates = Array<'idle' | 'fetching' | 'debouncing' | 'error'>

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

type TEvents = {
    type: 'updateTodoValue',
    data?: {
        response?: IAPIResponse,
        todoValue?: string
    }
}

export const debounceMachine = new MachineConfig<IContext, TStates, TEvents>({
    url: '',
    data: null,
    todoValue: "1",
    delay: 500
})

const fetchingUrl: TAsyncCallback<IContext> = (context) => {
    const { url } = context
    return fetch(url + context.todoValue)
        .then(res => res.json())
        .then(data => ({ response: data }))
}

const { debouncing, fetching } = debounceMachine.addStates(['idle', 'debouncing', 'fetching', 'error'])

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
