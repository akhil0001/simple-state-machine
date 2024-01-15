import { MachineConfig, createContext, createEvents, createStates } from "../../lib";

const states = createStates('idle', 'running', 'afterTimerRunning', 'alwaysRunning', 'runningCallback', 'asyncCallback');
const events = createEvents('NEXT', 'RESTART')
const context = createContext({
    id: 0
});

export const ManyStatesMachine = new MachineConfig(states, context, events)

const { whenIn } = ManyStatesMachine;

ManyStatesMachine.on('RESTART').moveTo('idle').updateContext({
    id: 0
})

whenIn('idle').on('NEXT').moveTo('running')
whenIn('running').on('NEXT').moveTo('afterTimerRunning')
whenIn('afterTimerRunning').after(3000).moveTo('alwaysRunning').updateContext({
    id: context => context.id + 1
})
whenIn('afterTimerRunning').on('NEXT').moveTo('alwaysRunning')

whenIn('alwaysRunning').always().moveTo('runningCallback')

whenIn('runningCallback').invokeCallback((context, callback) => {
    const nextId = context.id + 1;
    const timerId = setTimeout(() => {
        callback({
            type: "NEXT",
            data: {
                id: nextId
            }
        })
    }, 1000);
    return () => {
        clearTimeout(timerId)
    }
}).on('NEXT').moveTo('asyncCallback').updateContext({
    id: (_, event) => event.data.id
})