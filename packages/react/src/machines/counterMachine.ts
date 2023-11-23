import { MachineConfig, createEvents, createStates, createContext } from "@simple-state-machine/core";

interface IContext {
    count: number;
    historyCount?: number
    historyHistoryCount?: number
}

const events = createEvents('increment');
const states = createStates('idle')
const context: IContext = createContext({ count: 0 })
export const counterMachine = new MachineConfig(states, context, events)

counterMachine.getStates().idle.on("increment").updateContext((context) => ({ ...context, count: context.count + 1 })).updateContext({ historyHistoryCount: context => context.count })
counterMachine.getStates().idle.on("increment").updateContext({ historyCount: context => context.count })
