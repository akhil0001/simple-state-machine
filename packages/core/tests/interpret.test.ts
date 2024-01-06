import { describe, expect, test, vi } from 'vitest'
import { MachineConfig, createContext, createEvents, createStates } from '../lib'
import { TReturnState, interpret } from '../lib/interpret/interpret'
import { MACHINE_SUPER_STATE } from '../lib/constants'

const context = createContext({
    count: 0
})
const events = createEvents('INC', 'DEC')
const states = createStates()
const statelessMachine = new MachineConfig(states, context, events)
statelessMachine.on('INC').updateContext({
    count: context => context.count + 1
})

statelessMachine.on('DEC').updateContext({
    count: context => context.count - 1
})

describe("interpret machine config", () => {
    let state = {} as TReturnState<typeof states, typeof context>;
    const { start, subscribe, send } = interpret(statelessMachine);
    const callback = {
        subscribeCallback(newState: TReturnState<typeof states, typeof context>) {
            state = {...newState}
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
        expect(state.context).toEqual({count: 0})
    })
})

describe('interpret stateless machine config', () => {
    let state = {} as TReturnState<typeof states, typeof context>;
    const { start, subscribe, send } = interpret(statelessMachine);
    const subscribeCallback = (newState: TReturnState<typeof states, typeof context>) => {
            state = {...newState}
    }
    subscribe(subscribeCallback)
    start();
    const increment = () => send('INC');
    
    test('state value should be super state', () => {
        expect(state.value).toEqual(MACHINE_SUPER_STATE) 
    })

    test('should update context on sending event', () => {
        increment();
        expect(state.context.count).toEqual(1)
    })
})