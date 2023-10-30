/* eslint-disable @typescript-eslint/no-explicit-any */
import { StateEvent } from "./StateEvent";
import { TCallback, TSendBack } from "./types";


type TConvertArrToObj<TArr extends readonly string[]> = {
    [TIndex in TArr[number]]: TArr[number]
}

type TTargetState<AllStates extends readonly string[]> = keyof TConvertArrToObj<AllStates>;

type TCond<IContext> = (context: IContext) => boolean;

type TStateJSON<IContext, AllStates extends readonly string[]> = {
    [action: string]: {
        target: TTargetState<AllStates>,
        cond: TCond<IContext>
    }
}

const returnTrue = () => true;

// TODO: Refactor the repeated logic to move to separate internal functions
// TODO: Have a similar func like assign of xstate
export class State<IContext, AllStates extends readonly string[]> {
    value: string = '';
    #stateEvent: StateEvent<IContext> = new StateEvent<IContext>();
    // protected stateMap: Map<string, TTargetState<IContext, AllStates>> = new Map();
    protected stateJSON: TStateJSON<IContext, AllStates> = {}
    protected stateEventsMap: Map<string, StateEvent<IContext>> = new Map();
    protected callback: TCallback<IContext> = () => () => { };
    #chainedActionType: string = '';
    delay: number = 0;
    constructor(val: string) {
        this.value = val;
        this.#setInitialAfter()
    }
    #setInitialAfter() {
        this.stateJSON['after'] = {
            target: this.value,
            cond: returnTrue
        }
    }
    invokeCallback(callback: (context: IContext, sendBack: TSendBack) => () => void) {
        this.callback = callback;
        const boundOn = this.on.bind(this);
        return { on: boundOn }
    }
    #if(cond: TCond<IContext>) {
        this.stateJSON[this.#chainedActionType].cond = cond;
    }
    on(actionType: string) {
        const stateEvent = new StateEvent<IContext>();
        this.#stateEvent = stateEvent;
        this.stateJSON[actionType] = {
            target: this.value,
            cond: returnTrue
        }
        this.stateEventsMap.set(actionType, this.#stateEvent);
        this.#chainedActionType = actionType;
        const fireAndForget = this.#stateEvent.fireAndForget.bind(this.#stateEvent);
        const updateContext = this.#stateEvent.updateContext.bind(this.#stateEvent);
        const boundIf = this.#if.bind(this)
        return { moveTo: this.#moveTo.bind(this), fireAndForget, updateContext, if: boundIf }
    }
    #moveTo(target: TTargetState<AllStates>) {
        this.stateJSON[this.#chainedActionType].target = target;
        const fireAndForget = this.#stateEvent.fireAndForget.bind(this.#stateEvent);
        const updateContext = this.#stateEvent.updateContext.bind(this.#stateEvent);
        const boundIf = this.#if.bind(this)
        return { fireAndForget: fireAndForget, updateContext, if: boundIf }
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
    getConfig() {
        const { stateEventsMap, stateJSON, callback } = this;
        return {
            callback,
            stateJSON,
            stateEventsMap
        }
    }
}