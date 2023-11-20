import { MachineConfig, createEvents } from "@simple-state-machine/core";


const events = createEvents('increment');

export const counterMachine = new MachineConfig([], {
    count: 0
}, events)

counterMachine.on('increment').updateContext(context => ({ count: context.count + 1 }))