import { MachineConfig } from "./MachineConfig"
import { TAsyncCallback } from "./types"

type TStates = Array<'idle' | 'fetching' | 'error'>

interface IAPIResponse {
    userId: string;
    title: string
}

interface IContext {
    url: string,
    data: IAPIResponse | null,
    todoValue: string
}

type TEvents = {
    type: 'fetch' | 'updateUrl' | 'updateTodoValue',
    data?: {
        url?: string;
        response?: IAPIResponse,
        todoValue?: string
    }
}

export const fetchingMachineConfig = new MachineConfig<IContext, TStates, TEvents>({
    url: '',
    data: null,
    todoValue: "1"
})

const { idle, fetching, error } = fetchingMachineConfig.addStates(['idle', 'fetching', 'error'])

const fetchingUrl: TAsyncCallback<IContext> = (context) => {
    const { url } = context
    return fetch(url + context.todoValue)
        .then(res => res.json())
        .then(data => ({ response: data }))
}

idle.on('updateUrl')
    .updateContext((context, event) => ({ ...context, url: event.data?.url ?? context.url }));

idle.on('updateTodoValue')
    .updateContext((context, event) => ({ ...context, todoValue: event.data?.todoValue ?? context.todoValue }))

idle.on('fetch')
    .moveTo('fetching')

fetching.invokeAsyncCallback(fetchingUrl)
    .onDone()
    .moveTo('idle')
    .fireAndForget((_, event) => console.log(event.data))
    .updateContext((context, event) => ({ ...context, data: event.data?.response ?? null }))

fetching.invokeAsyncCallback(fetchingUrl)
    .onError()
    .moveTo('error')
    .fireAndForget(() => console.log('fetch error'))

error.on('fetch')
    .moveTo('fetching')