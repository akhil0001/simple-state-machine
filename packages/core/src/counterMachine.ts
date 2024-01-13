import { MachineConfig, createEvents, createStates, createContext } from "../lib";

interface IContext {
    count: number;
    historyCount?: number
    historyHistoryCount?: number
}

const events = createEvents('increment');
const states = createStates('even', 'odd', 'decideEvenOrOdd',)
const context: IContext = createContext({ count: 0 })
export const counterMachine = new MachineConfig(states, context, events)

const { whenIn } = counterMachine;
whenIn('even').on('increment').moveTo('decideEvenOrOdd')

whenIn('odd').on('increment').moveTo('decideEvenOrOdd')

whenIn('decideEvenOrOdd').always().if(context => context.count % 2 === 0).moveTo('even')
whenIn('decideEvenOrOdd').always().moveTo('odd')
whenIn('decideEvenOrOdd').onExit().updateContext({
    count: context => context.count + 1
})
whenIn('decideEvenOrOdd').invokeAsyncCallback(() => fetch('https://jsonplaceholder.typicode.com/todos/').then(res => res.json())).onDone().updateContext({
    count: () => 100
})