import { StateEvent } from "./StateEvent";

export class State<IContext> {
    value: string = '';
    #stateEvent: StateEvent<IContext> = new StateEvent<IContext>();
    stateMap: Map<string, string> = new Map();
    stateEventsMap: Map<string, StateEvent<IContext>> = new Map();
    #chainedActionType: string = '';
    constructor(val: string) {
        this.value = val;
    }
    on(actionType: string) {
        const stateEvent = new StateEvent<IContext>();
        this.#stateEvent = stateEvent;
        this.stateMap.set(actionType, this.value);
        this.stateEventsMap.set(actionType, this.#stateEvent);
        this.#chainedActionType = actionType;
        const fireAndForget = this.#stateEvent.fireAndForget.bind(this.#stateEvent);
        const updateContext = this.#stateEvent.updateContext.bind(this.#stateEvent);
        return { moveTo: this.#moveTo.bind(this), fireAndForget, updateContext }
    }
    #moveTo(target: string) {
        this.stateMap.set(this.#chainedActionType, target);
        const fireAndForget = this.#stateEvent.fireAndForget.bind(this.#stateEvent);
        const updateContext = this.#stateEvent.updateContext.bind(this.#stateEvent);

        return { fireAndForget: fireAndForget, updateContext }
    }

}