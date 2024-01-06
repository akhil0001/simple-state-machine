import { TDefaultStates, TDefaultContext, IDefaultEvent } from "../types";
import { EventEmitter } from "./EventEmitter";
import { PubSub } from "./pubSub";
import { MachineConfig } from "../MachineConfig";

export type TReturnState<U extends TDefaultStates, V extends TDefaultContext> = {
    value: U[number],
    context: V
}

type TSubscribeCallback<U extends TDefaultStates, V extends TDefaultContext> = (state: TReturnState<U, V>) => unknown

type TInternalState = {
    value: 'hibernating' | 'active'
}

export function interpret<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>) {
    const { states, context } = machineConfig.getConfig();
    const statePubSub = new PubSub<TReturnState<U, V>>();
    const internalStatePubSub = new PubSub<TInternalState>({ value: 'hibernating' })
    const eventEmitter = new EventEmitter()

    function send(eventName: W[number]) {
        if (internalStatePubSub.getStore().value === 'hibernating') {
            throw new Error('Please start machine before sending events')
        }
        eventEmitter.emit(eventName)
    }

    function start() {
        if (internalStatePubSub.getStore().value === 'hibernating') {
            statePubSub.publish({ value: Object.keys(states)[0], context })
            internalStatePubSub.publish({ value: 'active' })
        }
    }

    function subscribe(cb: TSubscribeCallback<U, V>) {
        function unsubscribe() {
            statePubSub.unsubscribe(cb);
        }
        statePubSub.subscribe(cb);
        return unsubscribe
    }

    return { start, send, subscribe }
}

