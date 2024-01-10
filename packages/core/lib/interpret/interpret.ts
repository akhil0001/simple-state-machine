import { TDefaultStates, TDefaultContext, IDefaultEvent } from "../types";
import { EventEmitter } from "./EventEmitter";
import { PubSub } from "./pubSub";
import { MachineConfig } from "../MachineConfig";
import { MachineSuperState } from "./MachineSuperState";
import { StateHandler } from "./StateHandler";

export type TReturnState<U extends TDefaultStates, V extends TDefaultContext> = {
    value: U[number],
    context: V
}

type TSubscribeCallback<U extends TDefaultStates, V extends TDefaultContext> = (state: TReturnState<U, V>) => unknown

type TInternalState = {
    value: 'hibernating' | 'active'
}

type TInterpretReturn<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent> = {
    state: TReturnState<U, V>,
    send: (eventName: W[number], data?: object) => void;
    subscribe: (cb: TSubscribeCallback<U, V>) => () => void;
    start: () => void
}

export type ALL_EVENTS<W extends IDefaultEvent> = ['##update##' | "##updateContext##" | W[number]];

export function interpret<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>): TInterpretReturn<U, V, W> {
    const { states, context, stateJSON: masterStateJSON } = machineConfig.getConfig();
    const statePubSub = new PubSub<TReturnState<U, V>>();
    const internalStatePubSub = new PubSub<TInternalState>({ value: 'hibernating' })
    const eventEmitter = new EventEmitter<ALL_EVENTS<W>, [TReturnState<U, V>, object]>();
    let stateHandler: StateHandler<U, V, W> | null = null;
    let returnState: TReturnState<U, V> = {
        value: '',
        context: context
    }
    function _init() {
        statePubSub.subscribe((newReturnState) => {
            returnState.value = newReturnState.value;
            returnState.context = { ...newReturnState.context }
        })
        new MachineSuperState(masterStateJSON, eventEmitter)
        eventEmitter.on('##update##', (newReturnState) => {
            const clonedReturnState = { ...newReturnState };
            stateHandler?.exit(clonedReturnState)
            const nextState = states[clonedReturnState.value]
            statePubSub.publish(clonedReturnState)
            stateHandler = new StateHandler(nextState, eventEmitter, clonedReturnState.context, clonedReturnState.value);
        })
        eventEmitter.on('##updateContext##', (newReturnState) => {
            statePubSub.publish(newReturnState)
        })
    }

    function send(eventName: W[number], data?: object) {
        if (internalStatePubSub.getStore().value === 'hibernating') {
            throw new Error('Please start machine before sending events')
        }
        eventEmitter.emit(eventName, statePubSub.getStore(), data || {})
    }

    function start() {
        if (internalStatePubSub.getStore().value === 'hibernating') {
            eventEmitter.emit('##update##', {
                value: Object.keys(states)[0],
                context
            })
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

    _init()
    return { start, send, subscribe, state: returnState }
}

