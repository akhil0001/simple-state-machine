import { IDefaultEvent, TStateEvent, TStateEventCallback } from "./types";


type TStateEventCollection<IContext, IEvents extends IDefaultEvent> = TStateEvent<IContext, IEvents>[]
export class StateEvent<IContext, IEvents extends IDefaultEvent> {
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
    updateContext(cb: TStateEventCallback<IContext, IEvents, IContext>) {
        const oldStateContextCollection = this.stateEventCollection;
        this.stateEventCollection = [...oldStateContextCollection, { type: 'updateContext', callback: cb }]
        this.#updateStateJSON()
        return this
    }
}