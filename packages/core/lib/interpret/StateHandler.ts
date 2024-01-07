import { TDefaultStates, TDefaultContext, IDefaultEvent } from "..";
import { TStateJSONPayload } from "../Action";
import { TStateJSON } from "../State";
import { EventEmitter } from "./EventEmitter";
import { ALL_EVENTS, TReturnState } from "./interpret";

export class StateHandler<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>{
    stateJSON: TStateJSON<V, U, W>;
    eventEmitter: EventEmitter<ALL_EVENTS<W>, [TReturnState<U, V>, object]>;
    context: V;
    constructor(stateJSON: TStateJSON<V, U, W>, eventEmitter: EventEmitter<ALL_EVENTS<W>, [TReturnState<U, V>, object]>, context: V) {
        this.stateJSON = stateJSON;
        this.eventEmitter = eventEmitter;
        this.context = context;
        this.init();
    }

    init() {
        this.eventEmitter.on('##updateContext##', newState => this.setContext(newState.context))
        Reflect.ownKeys(this.stateJSON).forEach((event: string | symbol) => {
            if (typeof event === 'symbol') {
                const description = event.description || '';
                this.eventEmitter.on(description, (currentState: TReturnState<U, V>, eventData: object) => {
                    const action = this.stateJSON[event] as unknown as TStateJSONPayload<V, U, W>
                    this.runActions(action, currentState, description, eventData)
                })
            }
        })
    }

    getContext() {
        return this.context;
    }

    setContext(newContext: V) {
        this.context = newContext;
    }

    runActions(action: TStateJSONPayload<V, U, W>, currentState: TReturnState<U, V>, eventName: W[number], eventData: object) {
        const { event } = action;
        let resultContext = { ...this.context };
        event.stateEventCollection.forEach(stateEvent => {
            if (stateEvent.type === 'updateContext') {
                const stateEventResult = stateEvent.callback(resultContext, { type: eventName, data: { ...eventData } })
                resultContext = { ...resultContext, ...stateEventResult }
            }
            if (stateEvent.type === 'fireAndForget') {
                stateEvent.callback(resultContext, { type: eventName, data: { ...eventData } })
            }
        });
        const newState = { ...currentState, context: { ...resultContext } }
        this.eventEmitter.emit('##update##', newState)
    }


}
