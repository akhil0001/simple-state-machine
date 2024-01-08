import { describe, expect, test } from "vitest";
import { PubSub } from "../lib/interpret/pubSub";

describe('pubSub util', () => {
    const initialValue = {
        value: 'idle', context: {
            count: 0,
            dummyString: 'sample'
        }
    }
    const statePubSub = new PubSub<typeof initialValue>(initialValue)
    test('reflects initial value', () => {
        expect(statePubSub.getStore()).toEqual(initialValue)
    })
    test('publisher patches object, but shallow', () => {
        statePubSub.publish({ value: 'fetching' })
        expect(statePubSub.getStore()).toEqual({...initialValue, value: 'fetching'})
    })
})