import { describe, expect, test } from "vitest";
import { EventEmitter } from "../lib/interpret/EventEmitter";

describe('Fresh eventEventEmitter Instance', () => {
    const eventEmitter = new EventEmitter()
    test('new eventEmitter instance does not have any events in map', () => {
        expect(eventEmitter.eventsMap.size).toEqual(0)
    })
    test('reflect new event in map', () => {
        eventEmitter.on('SAMPLE', console.log)
        expect(eventEmitter.eventsMap.size).toEqual(1)
    })
    test('reflect zero events in map when off is called', () => {
        eventEmitter.off('SAMPLE', console.log)
        expect(eventEmitter.eventsMap.size).toEqual(0)
    })
})

describe('emit', () => {
    const eventEmitter = new EventEmitter();
    test('emits to all listeners', () => {
        let a = 1;
        let b = 'hello'
        function listenerOne() {
            a = 2;
        }
        function listenerTwo() {
            b = b + 'world'
        }
        eventEmitter.on('SAMPLE', listenerOne)
        eventEmitter.on('SAMPLE', listenerTwo);
        eventEmitter.emit('SAMPLE');
        expect(a).toEqual(2)
        expect(b).toEqual('helloworld')
    })
})

describe('off', () => {
    const eventEmitter = new EventEmitter()
    let a = 1;
    function inc() {
        a++;
    }
    eventEmitter.on('SAMPLE', inc);
    eventEmitter.on('SAMPLE', inc);
    test('removes listener', () => {
        eventEmitter.off('SAMPLE', inc)
        eventEmitter.emit('SAMPLE');
        expect(a).toEqual(2)
    })
    test('removes event when there is no listener left', () => {
        eventEmitter.off('SAMPLE', inc)
        eventEmitter.emit('SAMPLE')
        expect(a).toEqual(2)
        expect(eventEmitter.eventsMap.has('SAMPLE')).toEqual(false)
    })
    test('does not break when there is no event at all', () => {
        eventEmitter.off('MISTAKE', inc)
        expect(eventEmitter.eventsMap.has('MISTAKE')).toEqual(false)
    })
})