import { TDefaultStates, TDefaultContext, IDefaultEvent } from "..";
import { TStateJSONPayload } from "../Action";
import { TStateJSON } from "../State";
import { EventEmitter } from "./EventEmitter";
import { ALL_EVENTS, TReturnState } from "./interpret";

export type TInternalEvents = ['##exit##' | '##enter##' | '##after##' | '##always##'];

export class StateHandler<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>{
    stateJSON: TStateJSON<V, U, W>;
    eventEmitter: null | EventEmitter<ALL_EVENTS<W>, [TReturnState<U, V>, object]>;
    context: V;
    value: U[number];
    id: number;
    allEventUnsubscribers: Array<(...args: unknown[]) => unknown>
    timerIds: NodeJS.Timeout[];
    internalEventEmitter: null | EventEmitter<TInternalEvents, [TReturnState<U, V>, object]>;

    constructor(stateJSON: TStateJSON<V, U, W>, eventEmitter: EventEmitter<ALL_EVENTS<W>, [TReturnState<U, V>, object]>, context: V, value: U[number], id: number) {
        this.stateJSON = stateJSON;
        this.eventEmitter = eventEmitter;
        this.internalEventEmitter = new EventEmitter();
        this.context = context;
        this.allEventUnsubscribers = [];
        this.value = value;
        this.id = id;
        this.timerIds = [];
        this.init();
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
        this.allEventUnsubscribers.push(unsubscribe);
        Reflect.ownKeys(this.stateJSON).forEach((event: string | symbol) => {
            if (typeof event === 'symbol') {
                const description = event.description || '';
                const boundEventHandler = this.eventHandler.bind(this)
                const isInternalEventListener = ['##after##', '##enter##', '##exit##', '##always##'].some(event => event === description)
                if (this.eventEmitter && !isInternalEventListener) {
                    const unsubscribe = this.eventEmitter.on(description, (...args) => boundEventHandler(event, description, ...args))
                    this.allEventUnsubscribers.push(unsubscribe)
                }
                else {
                    const unsubscribe = this.internalEventEmitter?.on(description as TInternalEvents[number], (...args) => boundEventHandler(event, description, ...args))
                    this.allEventUnsubscribers.push(unsubscribe!)
                }
            }
        })
        this.internalEventEmitter?.emit('##enter##')
        this.internalEventEmitter?.emit('##always##')
        this.internalEventEmitter?.emit('##after##')
    }

    eventHandler(event: symbol, eventName: string, currentState: TReturnState<U, V>, eventData: object) {
        const action = this.stateJSON[event] as unknown as TStateJSONPayload<V, U, W>
        const boundRunTimer = this.runTimer.bind(this)
        const boundRunActions = this.runActions.bind(this)
        if (eventName === '##after##') {
            boundRunTimer(action, currentState, eventName, eventData)
        }
        else {
            boundRunActions(action, currentState, eventName, eventData)
        }
    }

    runTimer(action: TStateJSONPayload<V, U, W>, currentState: TReturnState<U, V>, eventName: W[number], eventData: object) {
        const { delay } = action;
        const delayInNumber = typeof delay === 'number' ? delay : delay(this.getContext())
        const boundRunActions = this.runActions.bind(this)
        const timerId = setTimeout(() => boundRunActions(action, currentState, eventName, eventData), delayInNumber);
        this.timerIds.push(timerId)
    }

    runActions(action: TStateJSONPayload<V, U, W>, currentState: TReturnState<U, V>, eventName: W[number], eventData: object) {
        const { event, target, isSetByDefault, cond } = action;
        let resultContext = { ...this.context };
        if (!cond(resultContext) || !this.eventEmitter || !this.internalEventEmitter) {
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
        if (isSetByDefault) {
            const newState = { ...currentState, context: { ...resultContext } }
            this.setContext({...resultContext})
            this.eventEmitter.emit('##updateContext##', newState)
        }
        else {
            const newState = { ...currentState, value: target, context: { ...resultContext }}
            this.setContext({...resultContext})
            this.exit(newState)
        }
    }

    exit(newState: TReturnState<U,V>) {
        this.internalEventEmitter?.emit('##exit##');
        this.allEventUnsubscribers.forEach(unsubscribe => unsubscribe())
        this.timerIds.forEach(timerId => {
            clearTimeout(timerId)
        })
        this.eventEmitter
        this.allEventUnsubscribers = [];
        this.timerIds = [];
        this.eventEmitter?.emit('##update##', newState)
        this.eventEmitter = null;
        this.internalEventEmitter = null;
    }
}
