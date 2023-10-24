import { TDefaultEvent } from "./types";

type TStateEventCollection<IContext> = {
    type: 'fireAndForget' | 'updateContext',
    callback: ({ context, event }: { context: IContext, event: TDefaultEvent }) => void
}[]
export class StateEvent<IContext> {
    stateEventCollection: TStateEventCollection<IContext> = []
    constructor() {
        this.stateEventCollection = [];
    }
    fireAndForget(cb: ({ context, event }: { context: IContext, event: TDefaultEvent }) => void) {
        const oldStateEventCollection = this.stateEventCollection;
        this.stateEventCollection = [...oldStateEventCollection, { type: 'fireAndForget', callback: cb }]
        return this
    }
    updateContext(cb: () => void) {
        const oldStateContextCollection = this.stateEventCollection;
        this.stateEventCollection = [...oldStateContextCollection, { type: 'updateContext', callback: cb }]
        return this
    }
}