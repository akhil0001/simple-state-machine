import { MachineConfig, createContext, createEvents, createStates } from "../../lib";

export function makeDebounceMachine(mockCallback) {
    const states = createStates('idle', 'debouncing', 'fetching')
    const events = createEvents('UPDATE_INPUT', 'FETCH', 'ERROR', 'SUCCESS');
    const context = createContext({
        input: "",
        result: ""
    })

    const debounceMachine = new MachineConfig(states, context, events)

    const whenIn = debounceMachine.whenIn;

    debounceMachine.on('UPDATE_INPUT').moveTo('debouncing').updateContext({
        input: (_, event) => event.data.input
    })


    whenIn('debouncing').after(5000).moveTo('fetching');
    whenIn('fetching').invokeCallback((context, callback) => {
        const { input } = context;
        const timerId = setTimeout(() => {
            mockCallback();
            callback({
                type: 'SUCCESS',
                data: {
                    result: 'hello ' + input
                }
            });
        }, 3000)
        return () => {
            clearTimeout(timerId)
        }
    }).on('SUCCESS').moveTo('idle').updateContext({
        result: (_, event) => event.data.result
    })

    return debounceMachine;
}