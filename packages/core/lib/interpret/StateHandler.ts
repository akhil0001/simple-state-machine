import { TDefaultStates, TDefaultContext, IDefaultEvent } from "..";
import { TStateJSONPayload } from "../Action";
import { TStateJSON } from "../State";
import { EventEmitter } from "./EventEmitter";
import { ALL_EVENTS, TReturnState } from "./interpret";

export class StateHandler<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>{
    stateJSON: TStateJSON<V, U, W>;
    eventEmitter: null | EventEmitter<ALL_EVENTS<W>, [TReturnState<U, V>, object]>;
    context: V;
    value: U[number];
    id: number;
    allEventUnscubscribers: Array<(...args: unknown[]) => unknown>
    constructor(stateJSON: TStateJSON<V, U, W>, eventEmitter: EventEmitter<ALL_EVENTS<W>, [TReturnState<U, V>, object]>, context: V, value: U[number], id: number) {
        this.stateJSON = stateJSON;
        this.eventEmitter = eventEmitter;
        this.context = context;
        this.allEventUnscubscribers = [];
        this.init();
        this.value = value,
            this.id = id;
    }

    getContext() {
        return this.context;
    }

    setContext(newContext: V) {
        this.context = newContext;
    }

    init() {
        if (!this.eventEmitter) {
            return;
        }
        const unsubscribe = this.eventEmitter.on('##updateContext##', newState => this.setContext(newState.context))
        this.allEventUnscubscribers.push(unsubscribe);
        Reflect.ownKeys(this.stateJSON).forEach((event: string | symbol) => {
            if (typeof event === 'symbol') {
                const description = event.description || '';
                const boundEventHandler = this.eventHandler.bind(this)
                if (this.eventEmitter) {
                    const unsubscribe = this.eventEmitter.on(description, (...args) => boundEventHandler(event, description, ...args))
                    this.allEventUnscubscribers.push(unsubscribe)
                }
            }
        })
        this.eventEmitter.emit('##enter##')
    }

    eventHandler(event: symbol, eventName: string, currentState: TReturnState<U, V>, eventData: object) {
        const action = this.stateJSON[event] as unknown as TStateJSONPayload<V, U, W>
        this.runActions(action, currentState, eventName, eventData)
    }

    runActions(action: TStateJSONPayload<V, U, W>, currentState: TReturnState<U, V>, eventName: W[number], eventData: object) {
        const { event, target, isSetByDefault, cond } = action;
        let resultContext = { ...this.context };
        if (!cond(resultContext)) {
            return
        }
        event.stateEventCollection.forEach(stateEvent => {
            if (stateEvent.type === 'updateContext') {
                const stateEventResult = stateEvent.callback(resultContext, { type: eventName, data: { ...eventData } })
                resultContext = { ...resultContext, ...stateEventResult }
            }
            if (stateEvent.type === 'fireAndForget') {
                stateEvent.callback(resultContext, { type: eventName, data: { ...eventData } })
            }
        });
        if (!this.eventEmitter) {
            return;
        }
        if (isSetByDefault) {
            const newState = { ...currentState, context: { ...resultContext } }
            this.eventEmitter.emit('##updateContext##', newState)
        }
        else {
            const newState = { ...currentState, value: target, context: { ...resultContext } }
            this.eventEmitter.emit('##update##', newState)
        }
    }

    destroy() {
        if (!this.eventEmitter) {
            return;
        }
        this.eventEmitter.emit('##exit##')
        this.allEventUnscubscribers.forEach(unsubscribe => unsubscribe())
        this.eventEmitter = null;
    }
}
