import { MachineConfig, createEvents, createStates, createContext } from "@simple-state-machine/core";

interface IContext {
    count: number;
    historyCount?: number
    historyHistoryCount?: number
}

const events = createEvents('increment');
const states = createStates('decideEvenOrOdd', 'even', 'odd')
const context: IContext = createContext({ count: 0 })
export const counterMachine = new MachineConfig(states, context, events)

const { even, odd, decideEvenOrOdd } = counterMachine.getStates()

decideEvenOrOdd.always().if(context => context.count % 2 === 0).moveTo('even')
decideEvenOrOdd.always().moveTo('odd')

even.on('increment').moveTo('decideEvenOrOdd').updateContext({ count: context => context.count + 1 })
odd.on('increment').moveTo('decideEvenOrOdd').updateContext({ count: context => context.count + 1 })
