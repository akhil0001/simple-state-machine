/* eslint-disable @typescript-eslint/no-explicit-any */
import { StateEvent } from "./StateEvent";
import { IDefaultEvent, TCallback, TSendBack } from "./types";


type TConvertArrToObj<TArr extends readonly string[]> = {
    [TIndex in TArr[number]]: TArr[number]
}

type TTargetState<AllStates extends readonly string[]> = keyof TConvertArrToObj<AllStates>;

type TCond<IContext> = (context: IContext) => boolean;

type TActionType = string | symbol;

type TStateJSON<IContext, AllStates extends readonly string[]> = {
    [key: TActionType]: {
        target: TTargetState<AllStates>,
        cond: TCond<IContext>,
        isSetByDefault: boolean
    }
}

const returnTrue = () => true;

// TODO: Have a similar func like assign of xstate
export class State<IContext, AllStates extends readonly string[], IEvents extends IDefaultEvent> {
    value: string = '';
    #stateEvent: StateEvent<IContext, IEvents> = new StateEvent<IContext, IEvents>();
    protected stateJSON: TStateJSON<IContext, AllStates> = {}
    protected stateEventsMap: Map<TActionType, StateEvent<IContext, IEvents>> = new Map();
    protected callback: TCallback<IContext, IEvents> = () => () => { };
    #chainedActionType: TActionType = '';
    protected delay: number = 0;

    constructor(val: string) {
        this.value = val;
    }

    #initStateEvent() {
        const stateEvent = new StateEvent<IContext, IEvents>();
        this.#stateEvent = stateEvent;
    }

    #if(cond: TCond<IContext>) {
        this.stateJSON[this.#chainedActionType].cond = cond;
        const boundMoveTo = this.#moveTo.bind(this);
        return { moveTo: boundMoveTo }
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
        return { ...returnActions }
    }
    on(actionType: IEvents['type']) {
        this.#initStateEvent()
        this.stateJSON[actionType] = {
            target: this.value,
            cond: returnTrue,
            isSetByDefault: true
        }
        this.stateEventsMap.set(actionType, this.#stateEvent);
        this.#chainedActionType = actionType;
        const returnActions = this.#returnStateEventActions()
        const boundIf = this.#if.bind(this)
        return { moveTo: this.#moveTo.bind(this), if: boundIf, ...returnActions }
    }
    onEnter() {
        this.#initStateEvent();
        const actionType = '##enter##'
        this.stateJSON[actionType] = {
            target: this.value,
            isSetByDefault: true,
            cond: returnTrue
        }
        this.stateEventsMap.set(actionType, this.#stateEvent);
        this.#chainedActionType = actionType;
        const returnActions = this.#returnStateEventActions();
        return { ...returnActions };
    }
    always() {
        this.#initStateEvent();
        const actionType = Symbol('##always##');
        this.#chainedActionType = actionType
        this.stateJSON[actionType] = {
            target: this.value,
            isSetByDefault: true,
            cond: returnTrue
        }

        this.stateEventsMap.set(actionType, this.#stateEvent);
        const boundIf = this.#if.bind(this);
        const boundMoveTo = this.#moveTo.bind(this);
        const returnActions = this.#returnStateEventActions();

        return { ...returnActions, if: boundIf, moveTo: boundMoveTo }
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
        this.#chainedActionType = '##after##';
        this.stateJSON[this.#chainedActionType] = {
            target: this.value,
            cond: returnTrue,
            isSetByDefault: true
        }
        this.#initStateEvent()
        this.stateEventsMap.set('##after##', this.#stateEvent)
        const returnActions = this.#returnStateEventActions()
        const boundMoveTo = this.#moveTo.bind(this)
        const boundIf = this.#if.bind(this)
        return { ...returnActions, moveTo: boundMoveTo, if: boundIf }
    }
    getConfig() {
        const { stateEventsMap, stateJSON, callback, delay } = this;
        return {
            callback,
            stateJSON,
            stateEventsMap,
            delay
        }
    }
    invokeCallback(callback: (context: IContext, sendBack: TSendBack<IEvents>) => () => void) {
        this.callback = callback;
        const boundOn = this.on.bind(this);
        return { on: boundOn }
    }
}