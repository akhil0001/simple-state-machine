import { MachineConfig, createEvents, createStates } from "@simple-state-machine/core";


const events = createEvents('increment');
const states = createStates('idle')
export const counterMachine = new MachineConfig(states, {
    count: 0
}, events)

counterMachine.getStates().idle.on("increment").updateContext((context) => ({ ...context, count: context.count + 1 }))