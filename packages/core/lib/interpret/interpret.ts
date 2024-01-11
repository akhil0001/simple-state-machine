import { TDefaultStates, TDefaultContext, IDefaultEvent } from "../types";
import { EventEmitter } from "./EventEmitter";
import { PubSub } from "./pubSub";
import { MachineConfig } from "../MachineConfig";
import { MachineSuperState } from "./MachineSuperState";
import { StateHandler } from "./StateHandler";
import { TInterpretReturn, TReturnState, ALL_EVENTS, TSubscribeCallback, TInterpretInternalState } from "./types";

export function interpret<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>, context: Partial<V> = {} as V): TInterpretReturn<U, V, W> {
    const { states, context: declarationContext, stateJSON: masterStateJSON } = machineConfig.getConfig();
    const statePubSub = new PubSub<TReturnState<U, V>>();
    const internalStatePubSub = new PubSub<TInterpretInternalState>({ value: 'hibernating' })
    const eventEmitter = new EventEmitter<ALL_EVENTS<W>, [TReturnState<U, V>, object]>();
    let stateHandler: StateHandler<U, V, W> | null = null;
    let returnState: TReturnState<U, V> = {
        value: '',
        context: { ...declarationContext, ...context }
    }
    function _init() {
        statePubSub.subscribe((newReturnState) => {
            returnState.value = newReturnState.value;
            returnState.context = { ...newReturnState.context }
        })
        new MachineSuperState(masterStateJSON, eventEmitter)
        eventEmitter.on('##update##', (newReturnState) => {
            const clonedReturnState = { ...newReturnState };
            statePubSub.publish(clonedReturnState)
            if(!stateHandler){
                eventEmitter.emit('##permitToEnterNewState##')
            }
        })
        eventEmitter.on('##updateContext##', (newReturnState) => {
            statePubSub.publish(newReturnState)
        })
        eventEmitter.on('##permitToEnterNewState##', () => {
            const newReturnState = statePubSub.getStore();
            const nextState = states[newReturnState.value]
            stateHandler = new StateHandler(nextState, eventEmitter, newReturnState.context, newReturnState.value);
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
                context: { ...declarationContext, ...context }
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

