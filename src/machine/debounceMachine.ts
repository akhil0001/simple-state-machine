import { MachineConfig } from "./MachineConfig";
import { TAsyncCallback } from "./types";

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
    type: 'updateUrl' | 'updateTodoValue',
    data?: {
        url?: string;
        response?: IAPIResponse,
        todoValue?: string
    }
}

export const debouncingMachine = new MachineConfig<IContext, TStates, TEvents>({
    url: '',
    data: null,
    todoValue: "1",
    delay: 1000
})

const fetchingUrl: TAsyncCallback<IContext> = (context) => {
    const { url } = context
    return fetch(url + context.todoValue)
        .then(res => res.json())
        .then(data => ({ response: data }))
}

const { idle, debouncing, fetching, error } = debouncingMachine.addStates(['idle', 'debouncing', 'fetching', 'error'])

idle.on('updateUrl')
    .updateContext((context, event) => ({ ...context, url: event.data?.url ?? context.url }))

idle.on('updateTodoValue')
    .moveTo('debouncing')
    .updateContext((context, event) => ({ ...context, todoValue: event.data?.todoValue ?? context.todoValue }))

debouncing.after(context => context.delay)
    .moveTo('fetching')

debouncing.on('updateTodoValue')
    .moveTo('debouncing')
    .updateContext((context, event) => ({
        ...context,
        todoValue: event.data?.todoValue ?? context.todoValue
    }))

fetching.invokeAsyncCallback(fetchingUrl)
    .onDone()
    .moveTo('idle')
    .updateContext((context, event) => ({ ...context, data: event.data?.response ?? null }))

fetching.invokeAsyncCallback(fetchingUrl)
    .onError()
    .moveTo('error')

fetching.on('updateTodoValue')
    .moveTo('debouncing')
    .updateContext((context, event) => ({
        ...context,
        todoValue: event.data?.todoValue ?? context.todoValue
    }))

error.on('updateTodoValue')
    .moveTo('debouncing')
    .updateContext((context, event) => ({
        ...context,
        todoValue: event.data?.todoValue ?? context.todoValue
    }))