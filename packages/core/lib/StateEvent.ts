import { assign } from ".";
import { IDefaultEvent, TAssignPayload, TDefaultContext, TStateEvent, TStateEventCallback } from "./types";


type TStateEventCollection<IContext extends TDefaultContext, IEvents extends IDefaultEvent> = TStateEvent<IContext, IEvents>[]
export class StateEvent<IContext extends TDefaultContext, IEvents extends IDefaultEvent> {
    stateEventCollection: TStateEventCollection<IContext, IEvents> = []
    #updateStateJSON: () => void;
    constructor(updateStateJSON: () => void) {
        this.stateEventCollection = [];
        this.#updateStateJSON = updateStateJSON;
    }
    fireAndForget(cb: TStateEventCallback<IContext, IEvents, void>) {
        const oldStateEventCollection = this.stateEventCollection;
        this.stateEventCollection = [...oldStateEventCollection, { type: 'fireAndForget', callback: cb }]
        this.#updateStateJSON()
        return this
    }
    updateContext(payload: TAssignPayload<IContext, IEvents>) {
        const oldStateContextCollection = this.stateEventCollection;
        const cb = assign(payload);
        this.stateEventCollection = [...oldStateContextCollection, { type: 'updateContext', callback: cb }]
        this.#updateStateJSON()
        return this
    }
}