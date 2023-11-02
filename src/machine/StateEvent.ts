import { TDefaultEvent, TStateEvent } from "./types";


type TStateEventCollection<IContext> = TStateEvent<IContext>[]
export class StateEvent<IContext> {
    stateEventCollection: TStateEventCollection<IContext> = []
    constructor() {
        this.stateEventCollection = [];
    }
    fireAndForget(cb: (context: IContext, event: TDefaultEvent) => void) {
        const oldStateEventCollection = this.stateEventCollection;
        this.stateEventCollection = [...oldStateEventCollection, { type: 'fireAndForget', callback: cb }]
        return this
    }
    updateContext(cb: (context: IContext, event: TDefaultEvent) => IContext) {
        const oldStateContextCollection = this.stateEventCollection;
        this.stateEventCollection = [...oldStateContextCollection, { type: 'updateContext', callback: cb }]
        return this
    }
}