import { describe, expect, test, vi, beforeEach, afterEach, it } from 'vitest'
import { MachineConfig, createContext, createEvents, createStates } from '../lib'
import { TReturnState, interpret } from '../lib/interpret/interpret'
import { MACHINE_SUPER_STATE } from '../lib/constants'

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
    const events = createEvents('TOGGLE')
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
})