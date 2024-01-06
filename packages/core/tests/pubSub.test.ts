import { describe, expect, test } from "vitest";
import { PubSub } from "../lib/interpret/pubSub";

describe('pubSub util', () => {
    const initialValue = {
        value: 'idle', context: {
            count: 0,
            dummyString: 'sample'
        }
    }
    const statePubSub = new PubSub(initialValue)
    test('reflects initial value', () => {
        expect(statePubSub.store).toEqual(initialValue)
    })
    test('publisher does not patch object, but puts the object directly', () => {
        statePubSub.publish({ value: 'fetching' })
        expect(statePubSub.store).toEqual({value: 'fetching'})
    })
})