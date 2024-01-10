import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { MachineConfig, createContext, createEvents, createStates } from '../lib'
import { TReturnState, interpret } from '../lib/interpret/interpret'
import { MACHINE_SUPER_STATE } from '../lib/constants'
import { makeThemeMachine } from './machines/themeMachine'
import { makeDebounceMachine } from './machines/asyncMachine'

const context = createContext({
    count: 0
})
const events = createEvents('INC', 'DEC', "PRINT", "DOUBLE_INC", "CUSTOM_DATA")
const states = createStates();


const outerData = {
    context: context
}

const statelessMachine = new MachineConfig(states, context, events)
statelessMachine.on('INC').updateContext({
    count: context => context.count + 1
})

statelessMachine.on('DEC').updateContext({
    count: context => context.count - 1
})

statelessMachine.on('PRINT').fireAndForget(context => {
    outerData.context = { ...context };
})

statelessMachine.on('DOUBLE_INC').updateContext({
    count: context => context.count + 1
}).updateContext({
    count: context => context.count + 1
})

statelessMachine.on('CUSTOM_DATA').updateContext({
    count: (_, event) => event.data.customData
}).fireAndForget((_, event) => {
    outerData.context = { count: event.data.customData }
})

describe("interpret machine config", () => {
    let state = {} as TReturnState<typeof states, typeof context>;
    const { start, subscribe, send } = interpret(statelessMachine);
    const callback = {
        subscribeCallback(newState: TReturnState<typeof states, typeof context>) {
            state = { ...newState }
        }
    }
    const subscribeCallbackSpy = vi.spyOn(callback, 'subscribeCallback');
    subscribe(callback.subscribeCallback)
    const increment = () => send('INC');

    test('cannot send events without starting machine', () => {
        expect(increment).toThrowError('Please start machine before sending events')
    })

    test('starting machine more than once does nothing', () => {
        start();
        start();
        expect(subscribeCallbackSpy).toHaveBeenCalledTimes(1)
    })

    test('receive an update on starting machine', () => {
        start();
        expect(state.value).toEqual(MACHINE_SUPER_STATE);
        expect(state.context).toEqual({ count: 0 })
    })
})

describe('interpret stateless machine config', () => {
    let state = {} as TReturnState<typeof states, typeof context>;
    const { start, subscribe, send } = interpret(statelessMachine);
    const subscribeCallback = (newState: TReturnState<typeof states, typeof context>) => {
        state = { ...newState }
    }
    subscribe(subscribeCallback)
    start();
    const increment = () => send('INC');
    const decrement = () => send('DEC')
    test('state value should be super state', () => {
        expect(state.value).toEqual(MACHINE_SUPER_STATE)
    })

    test('should update context on sending event that is set to update context', () => {
        increment();
        expect(state.context.count).toEqual(1)
        decrement();
        decrement();
        expect(state.context.count).toEqual(-1)
        expect(state.value).toEqual(MACHINE_SUPER_STATE)
    })

    test('should fire a side effect on sending an event that is set to fireAndForget', () => {
        send('PRINT')
        expect(outerData.context.count).toEqual(-1)
    })

    test('chained updateContexts gets updated context from the previous context', () => {
        send('DOUBLE_INC');
        expect(state.context.count).toEqual(1)
    })

    test('accepts custom data in event', () => {
        send('CUSTOM_DATA', { customData: 100 })
        expect(state.context.count).toEqual(100)
        expect(outerData.context.count).toEqual(100)
    })
})

describe('interpret stateful machine', () => {
    const states = createStates('light', 'dark');
    const events = createEvents('TOGGLE', 'LIGHT', 'DARK')
    const context = createContext({
        switches: 0,
        lightSwitches: 0,
        darkSwitches: 0
    })
    const mock = vi.fn((context) => {
        return context
    })

    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    const themeMachine = new MachineConfig(states, context, events);
    const { whenIn } = themeMachine;

    whenIn('dark').on('TOGGLE').moveTo('light').updateContext({
        lightSwitches: context => context.lightSwitches + 1
    })
    whenIn('light').on('TOGGLE').moveTo('dark').updateContext({
        darkSwitches: context => context.darkSwitches + 1
    }).fireAndForget((context) => {
        setTimeout(() => mock(context), 1000)
    })
    themeMachine.on('TOGGLE').updateContext({
        switches: context => context.switches + 1
    })
    themeMachine.on('LIGHT').moveTo('light')
    themeMachine.on('DARK').moveTo('dark')

    const { start, send, subscribe } = interpret(themeMachine);
    let state = {
        value: MACHINE_SUPER_STATE,
        context: context
    }
    subscribe((newState) => state = newState);
    test('initial state will be the first state declared in the createStates function', () => {
        start();
        expect(state.value).toEqual('light')
    });

    test('should updateContext on sending event', () => {
        send('TOGGLE');
        expect(state.context.darkSwitches).toBe(1)
        expect(state.context.switches).toBe(1)
        expect(state.value).toEqual('dark')
    })

    test('should move to target state on sending event', () => {
        send('TOGGLE')
        expect(state.value).toEqual('light')
        expect(state.context.lightSwitches).toEqual(1)
    })

    test('should have fireAndForget fired with proper context', () => {
        send('TOGGLE')
        vi.advanceTimersByTime(1000)
        expect(mock).toHaveBeenLastCalledWith({
            switches: 3,
            darkSwitches: 2,
            lightSwitches: 1
        })
    })

    test('should move to new state on recieving an event at machine level', () => {
        send('LIGHT')
        expect(state.value).toEqual('light')
        send('DARK')
        expect(state.value).toEqual('dark')
        send('TOGGLE')
        expect(state.value).toEqual('light')
    })

    // NOTE: Following tests worked 
    // test('there should be less than or equal to 2 event emitters at any given point of time', () => {
    //     expect(eventEmitter.eventsMap.get('##updateContext##')?.length).toBeLessThanOrEqual(2)
    // })

    // test('there should be less than or equal to 1 event emitters at any given point of time', () => {
    //     expect(eventEmitter.eventsMap.get('##update##')?.length).toBeLessThanOrEqual(1)
    // })

})

describe('life cycle methods of state', () => {
    const lifeCycleMethods = {
        onEnter: () => 'entered',
        onExit: () => 'exit'
    }
    const onEnterSpy = vi.spyOn(lifeCycleMethods, 'onEnter');
    const onExitSpy = vi.spyOn(lifeCycleMethods, 'onExit');
    const ThemeMachine = makeThemeMachine(onEnterSpy, onExitSpy, () => { }, () => { })
    const { send, start } = interpret(ThemeMachine);

    test('should call onEnter()', () => {
        start();
        expect(onEnterSpy).toHaveBeenCalledWith({
            switches: 0,
            delay: 1000
        }, {
            type: '##enter##',
            data: undefined
        })
    })

    test('should call onExit()', () => {
        send('TOGGLE');
        expect(onExitSpy).toHaveBeenCalledWith({
            switches: 1,
            delay: 1000
        }, {
            type: '##exit##',
            data: undefined
        })
    })

    describe('utils of state', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })
        afterEach(() => {
            vi.restoreAllMocks()
        })
        const lifeCycleMethods = {
            onEnter: () => 'entered',
            onExit: () => 'exit',
            afterTimeoutFire: () => 'afterTimeoutFire',
            alwaysFireAndForget: () => 'alwaysFireAndFoget'
        }
        const onEnterSpy = vi.spyOn(lifeCycleMethods, 'onEnter');
        const onExitSpy = vi.spyOn(lifeCycleMethods, 'onExit');
        const afterTimeoutFireSpy = vi.spyOn(lifeCycleMethods, 'afterTimeoutFire');
        const alwaysFireAndFogetSpy = vi.spyOn(lifeCycleMethods, 'alwaysFireAndForget');
        const ThemeMachine = makeThemeMachine(onEnterSpy, onExitSpy, afterTimeoutFireSpy, alwaysFireAndFogetSpy)
        const { send, start, subscribe } = interpret(ThemeMachine)
        let state = {
            value: '',
            context: {
                switches: 0
            }
        };
        subscribe(newState => state = newState);
        start();
        test('should execute if condition', () => {
            send('TOGGLE');
            expect(state.value).toEqual('dark')
            for (let i = 0; i < 2; i++) {
                send('TOGGLE')
            }
            expect(state.context.switches).toEqual(3)
            expect(state.value).toEqual('light')
            for (let i = 0; i < 3; i++) {
                send('TOGGLE')
            }
            expect(state.context.switches).toEqual(6)
            expect(state.value).toEqual('dark')
        })

        test('should execute after condition', () => {
            send('TOGGLE')
            expect(state.value).toEqual('light')
            send('REPAIR');
            expect(state.value).toEqual('repairing')
            vi.advanceTimersByTime(5000)
            expect(state.value).toEqual('light')
            expect(afterTimeoutFireSpy).toHaveBeenCalledTimes(1)
        })

        test('should not execute after condition when there is state transition before that', () => {
            send('REPAIR');
            send('TOGGLE');
            vi.advanceTimersByTime(5000)
            expect(afterTimeoutFireSpy).not.toHaveBeenCalled()
        })

        test('should update timer by evaluating function passed to after', () => {
            send('UPDATE_DELAY', { delay: 5000 })
            send('TOGGLE') // now get state to dark
            vi.advanceTimersByTime(5000)
            expect(state.value).toEqual('repairing')
            vi.advanceTimersByTime(5000)
            expect(state.value).toEqual('light')
        })

        test.todo('should support multiple timers')

        test('should always execute actions when using `always`', () => {
            send('TEST_ALWAYS');
            expect(state.value).toBe('dark')
            expect(alwaysFireAndFogetSpy).toBeCalledTimes(1)
        })

        // test('should always moveTo target state on usage of `always`', () => {

        // })
    })

    describe('invoking callback should work', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })
        afterEach(() => {
            vi.restoreAllMocks()
        })


        test('should execute callback function mentioned in invokeCallback', () => {
            let state = {
                value: '',
                context: {
                    input: '',
                    result: {}
                }
            }
            const mockCallback = vi.fn(() => {
                return 'mock Callback'
            });
            const { start, send, subscribe } = interpret(makeDebounceMachine(mockCallback, () => { }));
            subscribe(newState => state = newState)
            start();
            expect(state.value).toBe('idle')
            send('UPDATE_INPUT', { input: 'world' })
            expect(state.value).toBe('debouncing')
            expect(state.context.input).toEqual('world')
            vi.advanceTimersByTime(1000);
            expect(state.value).toBe('debouncing')
            send('UPDATE_INPUT', { input: 'universe' })
            expect(state.value).toBe('debouncing')
            vi.advanceTimersByTime(5000)
            expect(state.value).toBe('fetching')
            send('UPDATE_INPUT', { input: 'earth' })
            expect(state.value).toBe('debouncing')
            vi.advanceTimersByTime(8000)
            expect(state.value).toBe('idle')
            expect(mockCallback).toBeCalledTimes(1)
        })

        test('should execute asynchronous function mentioned in invokeAsynCallback', async () => {
            const mockAsyncCallback = vi.fn((context) => new Promise((res) => {
                setTimeout(() => res(context.input), 1000)
            }));
            const { start, send, subscribe } = interpret(makeDebounceMachine(async () => { }, mockAsyncCallback));
            let state = {
                value: '',
                context: {
                    input: '',
                    result: ''
                }
            }
            subscribe(newState => state = newState);
            start();
            send('UPDATE_INPUT', { input: 'hello' })

            vi.advanceTimersByTime(5000)
            expect(mockAsyncCallback).toHaveBeenCalledOnce()
        })
    })
})

describe('interpet() returns updated state', () => {
    const {state, start, send, subscribe} = interpret(makeThemeMachine(() => {}, () => {}, () => {}, () => {}))
    let outerState = {
        value: '',
        context: {}
    }
    subscribe(newState => outerState = newState);
    test('state value should equal initial state',() => {
        start()
        expect(state.value).toEqual(outerState.value)
    })
    test('state context should equal initial context', () => {
        expect(state.context).toEqual(outerState.context)
    })
    test('state value should be updated', () => {
        send('TOGGLE');
        expect(state.value).toEqual("dark")
    })
    test('state context should be updated', () => {
        expect(state.context).toEqual(outerState.context)
    }) 
})