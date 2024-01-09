import { TDefaultStates, TDefaultContext, IDefaultEvent, TCallback, TAsyncCallback } from "..";
import { TStateJSONPayload } from "../Action";
import { TStateJSON } from "../State";
import { TStates } from "../internalTypes";
import { EventEmitter } from "./EventEmitter";
import { ALL_EVENTS, TReturnState } from "./interpret";

const INTERNAL_EVENTS = ['##exit##', '##enter##', '##after##', '##always##', '##onDone##', "##onError##"] as const;

type TInternalEvents = typeof INTERNAL_EVENTS;

export class StateHandler<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>{
    stateJSON: TStateJSON<V, U, W>;
    service: TCallback<V, W>;
    asyncService: TAsyncCallback<V>
    eventEmitter: null | EventEmitter<ALL_EVENTS<W>, [TReturnState<U, V>, object]>;
    context: V;
    value: U[number];
    id: number;
    allEventUnsubscribers: Array<(...args: unknown[]) => unknown>
    timerIds: NodeJS.Timeout[];
    internalEventEmitter: null | EventEmitter<TInternalEvents, [TReturnState<U, V>, object]>;

    constructor(state: TStates<U, V, W>[U[number]], eventEmitter: EventEmitter<ALL_EVENTS<W>, [TReturnState<U, V>, object]>, context: V, value: U[number], id: number) {
        const { stateJSON, callback, asyncCallback } = state.getConfig();
        this.stateJSON = stateJSON;
        this.service = callback;
        this.asyncService = asyncCallback;
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
        const unsubscribe = this.eventEmitter.on('##updateContext##', newState => this.setContext(newState.context));
        this.allEventUnsubscribers.push(unsubscribe);
        Reflect.ownKeys(this.stateJSON).forEach((event: string | symbol) => {
            if (typeof event === 'symbol') {
                const description = event.description || '';
                const boundEventHandler = this.eventHandler.bind(this)
                const isInternalEventListener = INTERNAL_EVENTS.some(event => event === description)
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
        this.runService()
        this.runAsyncService()
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
        let resultContext = { ...this.getContext() };
        if (!cond(resultContext) || !this.eventEmitter || !this.internalEventEmitter) {
            return
        }
        event.stateEventCollection.forEach(stateEvent => {
            if (stateEvent.type === 'updateContext') {
                const stateEventResult = stateEvent.callback(this.getContext(), { type: eventName, data: typeof eventData === 'object' ? { ...eventData } : eventData })
                resultContext = { ...this.getContext(), ...stateEventResult }
                this.setContext(resultContext)
            }
            if (stateEvent.type === 'fireAndForget') {
                stateEvent.callback(this.getContext(), { type: eventName, data: typeof eventData === 'object' ? { ...eventData } : eventData })
            }
        });
        if (isSetByDefault) {
            const newState = { ...currentState, context: { ...this.getContext() } }
            this.eventEmitter.emit('##updateContext##', newState)
        }
        else {
            const newState = { ...currentState, value: target, context: { ...this.getContext() } }
            this.eventEmitter.emit('##update##', newState)
        }
    }

    runService() {
        const cleanUpEffect = this.service(this.getContext(), (action) => {
            if (typeof action === 'string') {
                this.eventEmitter?.emit(action, { value: this.value, context: this.getContext() })
            }
            if (typeof action === 'object') {
                this.eventEmitter?.emit(action.type, { value: this.value, context: this.getContext() }, action.data)
            }
        })
        if (typeof cleanUpEffect === 'function')
            this.allEventUnsubscribers.push(cleanUpEffect)
    }

    async runAsyncService() {
        try {
            const result = await this.asyncService(this.getContext())
            this.internalEventEmitter?.emit('##onDone##', {
                value: this.value,
                context: this.getContext()
            }, result)
        }
        catch (err) {
            this.internalEventEmitter?.emit('##onError##', {
                value: this.value,
                context: this.getContext()
            }, err as object)
        }
    }

    exit(newState: TReturnState<U, V>) {
        this.internalEventEmitter?.emit('##exit##', newState);
        this.allEventUnsubscribers.forEach(unsubscribe => unsubscribe())
        this.timerIds.forEach(timerId => {
            clearTimeout(timerId)
        })
        this.eventEmitter
        this.allEventUnsubscribers = [];
        this.timerIds = [];
        this.eventEmitter = null;
        this.internalEventEmitter = null;
    }
}
