import { TDefaultStates, TDefaultContext, IDefaultEvent } from "..";
import { TStateJSONPayload } from "../Action";
import { TStateJSON } from "../State";
import { EventEmitter } from "./EventEmitter";
import { ALL_EVENTS, TEventEmitterState } from "./types";

export class MachineSuperState<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent> {
    stateJSON: TStateJSON<V, U, W>;
    eventEmitter: EventEmitter<ALL_EVENTS<W>, [TEventEmitterState<U,V>, object]>;
    constructor(stateJSON: TStateJSON<V, U, W>, eventEmitter: EventEmitter<ALL_EVENTS<W>, [TEventEmitterState<U,V>, object]>) {
        this.stateJSON = stateJSON
        this.eventEmitter = eventEmitter;
        this.init();
    }
    init() {
        Reflect.ownKeys(this.stateJSON).forEach((event: string | symbol) => {
            if (typeof event === 'symbol') {
                const description = event.description || '';
                this.eventEmitter.on(description, (currentState: TEventEmitterState<U,V>, eventData: object) => {
                    const action = this.stateJSON[event] as unknown as TStateJSONPayload<V, U, W>
                    this.runActions(action, currentState, description, eventData)
                })
            }
        })
    }

    runActions(action: TStateJSONPayload<V, U, W>, currentState: TEventEmitterState<U,V>, eventName: W[number], eventData: object) {
        const { event, target, isSetByDefault } = action;
        let resultContext = { ...currentState.context };
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
            this.eventEmitter.emit('##updateContext##', { ...currentState, context: { ...resultContext } })
        }
        else {
            this.eventEmitter.emit('##update##', {
                ...currentState, value: target, context: {
                    ...resultContext
                }
            })
        }
    }
}