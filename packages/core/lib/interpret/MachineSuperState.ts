import { TDefaultStates, TDefaultContext, IDefaultEvent } from "..";
import { TStateJSONPayload } from "../Action";
import { TStateJSON } from "../State";
import { EventEmitter } from "./EventEmitter";
import { ALL_EVENTS, TReturnState } from "./interpret";

export class MachineSuperState<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent> {
    stateJSON: TStateJSON<V, U, W>;
    eventEmitter: EventEmitter<ALL_EVENTS<W>, [TReturnState<U, V>]>;
    constructor(stateJSON: TStateJSON<V, U, W>, eventEmitter: EventEmitter<ALL_EVENTS<W>, [TReturnState<U, V>]>) {
        this.stateJSON = stateJSON
        this.eventEmitter = eventEmitter;
        this.init();
    }
    init() {
        Reflect.ownKeys(this.stateJSON).forEach((event: string | symbol) => {
            if (typeof event === 'symbol') {
                const description = event.description || '';
                this.eventEmitter.on(description, (currentState) => {
                    const action = this.stateJSON[event] as unknown as TStateJSONPayload<V, U, W>
                    this.runActions(action, currentState, description)
                })
            }
        })
    }

    runActions(action: TStateJSONPayload<V, U, W>, currentState: TReturnState<U, V>, eventName: W[number]) {
        const { event } = action;
        let resultContext = { ...currentState.context };
        event.stateEventCollection.forEach(stateEvent => {
            if (stateEvent.type === 'updateContext') {
                const stateEventResult = stateEvent.callback(resultContext, { type: eventName, data: {} })
                resultContext = { ...resultContext, ...stateEventResult }
            }
            if(stateEvent.type === 'fireAndForget') {
                stateEvent.callback(currentState.context, {type: eventName, data: {}})
            }
        });
        this.eventEmitter.emit('##update##', { ...currentState, context: { ...resultContext } })
    }
}