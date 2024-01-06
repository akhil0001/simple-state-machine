import { describe, expect, test } from 'vitest'
import { MachineConfig, createContext, createEvents } from '../lib'
import { interpret } from '../lib/interpret/interpret'
import { MACHINE_SUPER_STATE } from '../lib/constants'

const context = createContext({
    count: 0
})
const events = createEvents('INC', 'DEC')

const statelessMachine = new MachineConfig([], context, events)
statelessMachine.on('INC').updateContext({
    count: context => context.count + 1
})

statelessMachine.on('DEC').updateContext({
    count: context => context.count - 1
})

describe("interpret machine config", () => {
    let state = {} as any;
    const { start, subscribe, send } = interpret(statelessMachine)
    subscribe(newState => { state = {...newState} })
    const increment = () => send('INC');

    test('cannot send events without starting machine', () => {
        expect(increment).toThrowError('Please start machine before sending events')
    })
    test('receive an update on starting machine', () => {
        start();
        expect(state.value).toEqual(MACHINE_SUPER_STATE);
        expect(state.context).toEqual({count: 0})
    })
})