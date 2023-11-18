import { TStateEvent, TStateEventCallback } from "./types";


type TStateEventCollection<IContext, IEvents> = TStateEvent<IContext, IEvents>[]
export class StateEvent<IContext, IEvents> {
    stateEventCollection: TStateEventCollection<IContext, IEvents> = []
    constructor() {
        this.stateEventCollection = [];
    }
    fireAndForget(cb: TStateEventCallback<IContext, IEvents, void>) {
        const oldStateEventCollection = this.stateEventCollection;
        this.stateEventCollection = [...oldStateEventCollection, { type: 'fireAndForget', callback: cb }]
        return this
    }
    updateContext(cb: TStateEventCallback<IContext, IEvents, IContext>) {
        const oldStateContextCollection = this.stateEventCollection;
        this.stateEventCollection = [...oldStateContextCollection, { type: 'updateContext', callback: cb }]
        return this
    }
}