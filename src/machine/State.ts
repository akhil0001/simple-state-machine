/* eslint-disable @typescript-eslint/no-explicit-any */
import { StateEvent } from "./StateEvent";
import { TCallback, TSendBack } from "./types";

type TTargetState<IContext> = ((context: IContext) => string) | string;

// TODO: Refactor the repeated logic to move to separate internal functions
// TODO: Have a similar func like assign of xstate
export class State<IContext> {
    value: string = '';
    #stateEvent: StateEvent<IContext> = new StateEvent<IContext>();
    stateMap: Map<string, TTargetState<IContext>> = new Map();
    stateEventsMap: Map<string, StateEvent<IContext>> = new Map();
    callback: TCallback<IContext> = () => () => { };
    #chainedActionType: string = '';
    delay: number = 0;
    constructor(val: string) {
        this.value = val;
        this.stateMap.set('after', this.value)
    }
    invokeCallback(callback: (context: IContext, sendBack: TSendBack) => () => void) {
        this.callback = callback;
        const boundOn = this.on.bind(this);
        return { on: boundOn }
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
    #moveTo(target: TTargetState<IContext>) {
        this.stateMap.set(this.#chainedActionType, target);
        const fireAndForget = this.#stateEvent.fireAndForget.bind(this.#stateEvent);
        const updateContext = this.#stateEvent.updateContext.bind(this.#stateEvent);

        return { fireAndForget: fireAndForget, updateContext }
    }
    after(time: number) {
        this.delay = time;
        this.#chainedActionType = 'after';
        this.#stateEvent = new StateEvent<IContext>();
        this.stateEventsMap.set('after', this.#stateEvent)
        const boundFireAndForget = this.#stateEvent.fireAndForget.bind(this.#stateEvent);
        const boundUpdateContext = this.#stateEvent.updateContext.bind(this.#stateEvent);
        const boundMoveTo = this.#moveTo.bind(this)
        return { fireAndForget: boundFireAndForget, updateContext: boundUpdateContext, moveTo: boundMoveTo }
    }
}