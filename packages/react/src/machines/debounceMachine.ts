import { MachineConfig, assign, createEvents, createStates } from "@simple-state-machine/core";

function eitherOr<T, U>(arg1: T, arg2: U): T | U {
    return arg1 || arg2
}

const states = createStates('idle', 'debouncing', 'fetching', 'error')

const events = createEvents('updateInput')

const context = { response: eitherOr({ id: 0, description: 0 }, {}), input: 0 }

export const debounceMachine = new MachineConfig(states, context, events)

const { idle, debouncing, fetching } = debounceMachine.getStates()

const updateInput = assign<typeof context, typeof events>({
    input: (_, event) => event.data.input
})

idle.on('updateInput').updateContext(updateInput)
idle.on('updateInput').moveTo('debouncing')

debouncing.after(5000).moveTo('fetching')
debouncing.on('updateInput').updateContext(updateInput)
debouncing.on('updateInput').moveTo('debouncing')

fetching.on('updateInput').moveTo('debouncing').updateContext(updateInput)

const asyncService = fetching.invokeAsyncCallback((context) => fetch('https://jsonplaceholder.typicode.com/todos/' + context.input))

asyncService.onDone().moveTo('idle').updateContext((context, event) => ({
    ...context,
    response: event.data
}))

asyncService.onError().moveTo('error')

fetching.onExit().fireAndForget(() => console.log('exited fire and forget'))