import { MachineConfig, createContext, createEvents, createStates } from "../../lib";

const states = createStates('idle', 'debouncing', 'fetching', 'error', 'forward');
const events = createEvents('UPDATE_INPUT', 'FETCH', 'SUCCESS', 'SET_FLAG');
const context = createContext({
    input: '',
    response: "",
    lifeCycleState: "hibernating",
    lifeCycleSpy: (lc: string) => lc,
    flag: true
});

export const lifeCycleMachine = new MachineConfig(states, context, events);

const whenIn = lifeCycleMachine.whenIn;

lifeCycleMachine.on('UPDATE_INPUT').moveTo('debouncing').updateContext({
    input: (_, event) => event.data.input
});

lifeCycleMachine.on('SET_FLAG').updateContext({
    flag: (_, event) => event.data.flag
})

// idle
whenIn('idle').onEnter().updateContext({
    lifeCycleState: 'idle-entered'
})

whenIn('idle').onExit().updateContext({
    lifeCycleState: 'idle-exited'
}).fireAndForget((context) => context.lifeCycleSpy('idle-exited'))

// debouncing
whenIn('debouncing').onEnter().updateContext({
    lifeCycleState: 'debouncing-entered'
})
whenIn('debouncing').onExit().updateContext({
    lifeCycleState: 'debouncing-exited'
})

whenIn('debouncing').after(3000).moveTo('fetching').updateContext({
    lifeCycleState: 'debouncing-after'
}).fireAndForget(context => context.lifeCycleSpy('debouncing-after') )

// fetching
whenIn('fetching').onEnter().updateContext({
    lifeCycleState: 'fetching-entered'
})
whenIn('fetching').onExit().updateContext({
    lifeCycleState: 'fetching-exited'
}).fireAndForget(context => context.lifeCycleSpy('fetching-exited'))
whenIn('fetching').invokeAsyncCallback(() => {
    return new Promise(res =>  res({
        data: {
            title: 'Hello World'
        }
    })).then(res => res)
}).onDone().moveTo('forward').updateContext({
    response: (_, event) => event.data.title
}).fireAndForget(context => context.lifeCycleSpy('fetching-done'))

//forward
whenIn('forward').always().if(context => context.flag).moveTo('idle').fireAndForget(context => context.lifeCycleSpy('forward-always-idle'))
whenIn('forward').always().moveTo('error').fireAndForget(context => context.lifeCycleSpy('forward-always-error'))

whenIn('forward').onEnter().updateContext({
    lifeCycleState: 'forward-entered'
}).fireAndForget(context => context.lifeCycleSpy('forward-entered'))
whenIn('forward').onExit().updateContext({
    lifeCycleState: 'forward-exited'
}).fireAndForget(context => context.lifeCycleSpy('forward-exited'))