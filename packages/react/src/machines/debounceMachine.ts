import { MachineConfig, createEvents, createStates } from "@simple-state-machine/core";

function eitherOr<T, U>(arg1: T, arg2: U): T | U {
    return arg1 || arg2
}

const states = createStates('idle', 'debouncing', 'fetching', 'error')

const events = createEvents('updateInput')

export const debounceMachine = new MachineConfig(states, { response: eitherOr({ id: 0, description: 0 }, {}), input: 0 }, events)

const { debouncing, fetching } = debounceMachine.getStates()

debounceMachine.on('updateInput').moveTo('debouncing').updateContext((context, event) => ({ ...context, input: event.data.input }))

debouncing.after(500).moveTo('fetching')

const { onDone, onError } = fetching.invokeAsyncCallback((context) => fetch('https://jsonplaceholder.typicode.com/todos/' + context.input))

onDone().moveTo('idle').fireAndForget((_, event) => console.log(event)).updateContext((context, event) => ({
    ...context,
    response: event.data
}))
onError().moveTo('error').updateContext(context => ({ ...context, response: {} }))

