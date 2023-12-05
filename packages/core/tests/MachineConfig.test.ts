import {assert, describe, expect, test} from 'vitest';
import {MachineConfig, createStates} from '../lib/index'

describe("Access to functions", () => {
    const dummyMachine = new MachineConfig([], {}, [])
    test('Should have getStates()', () => {
        assert.isFunction(dummyMachine.getStates, 'getStates() should be a function')
    })
    test('Should have getConfig()', () => {
        assert.isFunction(dummyMachine.getConfig, 'getConfig should be a function')
    })
})

describe("States should be same as strings", () => {
    const states = createStates('idle', 'loading', 'load end')
    const dummyMachine = new MachineConfig(states, {}, [])
    test('Should match the createStates params', () => {
        expect(states).toEqual(Object.keys(dummyMachine.getStates()))
    })
});

describe("Return of methods of MachineConfig instance", () => {
    test('getStates() should return an empty objects when passed empty array', () => {
        const dummyMachine = new MachineConfig([], {} ,[]);
        expect({}).toEqual(dummyMachine.getStates())
    })
})