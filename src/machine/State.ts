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
        cond: TCond<IContext>,
        isSetByDefault: boolean
    }
}

const returnTrue = () => true;

// TODO: Refactor the repeated logic to move to separate internal functions
// TODO: Have a similar func like assign of xstate
export class State<IContext, AllStates extends readonly string[]> {
    value: string = '';
    #stateEvent: StateEvent<IContext> = new StateEvent<IContext>();
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
            cond: returnTrue,
            isSetByDefault: true
        }
    }
    #initStateEvent() {
        const stateEvent = new StateEvent<IContext>();
        this.#stateEvent = stateEvent;
    }

    #if(cond: TCond<IContext>) {
        this.stateJSON[this.#chainedActionType].cond = cond;
    }
    #returnStateEventActions() {
        const fireAndForget = this.#stateEvent.fireAndForget.bind(this.#stateEvent);
        const updateContext = this.#stateEvent.updateContext.bind(this.#stateEvent);
        return { fireAndForget, updateContext };
    }
    #moveTo(target: TTargetState<AllStates>) {
        this.stateJSON[this.#chainedActionType].target = target;
        this.stateJSON[this.#chainedActionType].isSetByDefault = false;
        const returnActions = this.#returnStateEventActions()
        const boundIf = this.#if.bind(this)
        return { ...returnActions, if: boundIf }
    }
    on(actionType: string) {
        this.#initStateEvent()
        this.stateJSON[actionType] = {
            target: this.value,
            cond: returnTrue,
            isSetByDefault: true
        }
        this.stateEventsMap.set(actionType, this.#stateEvent);
        this.#chainedActionType = actionType;
        const returnActions = this.#returnStateEventActions()
        return { moveTo: this.#moveTo.bind(this), ...returnActions }
    }
    onEnter() {
        this.#initStateEvent();
        const actionType = '##enter##'
        this.stateJSON[actionType] = {
            target: this.value,
            isSetByDefault: false,
            cond: returnTrue
        }
        this.stateEventsMap.set(actionType, this.#stateEvent);
        this.#chainedActionType = actionType;
        const returnActions = this.#returnStateEventActions();
        return { moveTo: this.#moveTo.bind(this), ...returnActions };
    }
    onExit() {
        this.#initStateEvent();
        const actionType = '##exit##';
        this.stateJSON[actionType] = {
            target: this.value,
            cond: returnTrue,
            isSetByDefault: true
        }
        this.stateEventsMap.set(actionType, this.#stateEvent);
        const returnActions = this.#returnStateEventActions();
        return { ...returnActions }
    }
    after(time: number) {
        this.delay = time;
        this.#chainedActionType = 'after';
        this.#initStateEvent()
        this.stateEventsMap.set('after', this.#stateEvent)
        const returnActions = this.#returnStateEventActions()
        const boundMoveTo = this.#moveTo.bind(this)
        const boundIf = this.#if.bind(this)
        return { ...returnActions, moveTo: boundMoveTo, if: boundIf }
    }
    getConfig() {
        const { stateEventsMap, stateJSON, callback } = this;
        return {
            callback,
            stateJSON,
            stateEventsMap
        }
    }
    invokeCallback(callback: (context: IContext, sendBack: TSendBack) => () => void) {
        this.callback = callback;
        const boundOn = this.on.bind(this);
        return { on: boundOn }
    }
}