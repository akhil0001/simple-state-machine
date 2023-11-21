import { MachineConfig, createEvents, createStates } from "@simple-state-machine/core";

const states = createStates('idle', 'fetching', 'throttling')

const events = createEvents('fetch')

export const throttleMachine = new MachineConfig(states, { url: 'https://jsonplaceholder.typicode.com/todos/', response: { description: {} } }, events)

const { idle, throttling, fetching } = throttleMachine.getStates()

idle.on('fetch').moveTo('fetching')

fetching.invokeAsyncCallback(context => fetch(context.url)).onDone().moveTo('throttling').fireAndForget((_, event) => console.log(event))

throttling.after(1000).moveTo('idle')