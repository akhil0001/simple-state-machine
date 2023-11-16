/* eslint-disable @typescript-eslint/no-explicit-any */
import { Action } from "./Action";
import { StateEvent } from "./StateEvent";
import { IDefaultEvent, TAfterCallback, TAsyncCallback, TCallback, TSendBack } from "./types";


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

export class State<IContext, AllStates extends readonly string[], IEvents extends IDefaultEvent> {
    value: string = '';
    protected stateJSON: TStateJSON<IContext, AllStates> = {}
    protected stateEventsMap: Map<TActionType, StateEvent<IContext, IEvents>> = new Map();
    protected callback: TCallback<IContext, IEvents> = () => () => { };
    protected asyncCallback: TAsyncCallback<IContext> = () => new Promise(res => res(null));
    protected delay: number | TAfterCallback<IContext> = 0;

    constructor(val: string) {
        this.value = val;
    }

    #updateStateJSON(actionType: TActionType, payload: Partial<{
        target: TTargetState<AllStates>,
        cond: TCond<IContext>,
        isSetByDefault: boolean
    }>) {
        const prev = this.stateJSON[actionType];
        this.stateJSON[actionType] = { ...prev, ...payload }
    }

    #onDone() {
        const stateEvent = new StateEvent<IContext, IEvents>()
        const actionType = Symbol('##onDone##');
        this.stateEventsMap.set(actionType, stateEvent);
        this.stateJSON[actionType] = {
            target: this.value,
            isSetByDefault: true,
            cond: returnTrue
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this);
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent);
        const returnActions = action.returnStateEventActions()
        const boundMoveTo = action.moveTo.bind(action)
        return { moveTo: boundMoveTo, ...returnActions }
    }

    #onError() {
        const stateEvent = new StateEvent<IContext, IEvents>()
        const actionType = Symbol('##onError##');
        this.stateEventsMap.set(actionType, stateEvent);
        this.stateJSON[actionType] = {
            target: this.value,
            isSetByDefault: true,
            cond: returnTrue
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this);
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent);
        const returnActions = action.returnStateEventActions()
        const boundMoveTo = action.moveTo.bind(action)
        return { moveTo: boundMoveTo, ...returnActions }
    }

    on(actionType: IEvents['type']) {
        const stateEvent = new StateEvent<IContext, IEvents>();
        this.stateJSON[actionType] = {
            target: this.value,
            cond: returnTrue,
            isSetByDefault: true
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this);
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent)
        this.stateEventsMap.set(actionType, stateEvent);
        const returnActions = action.returnStateEventActions()
        const boundIf = action.if.bind(action)
        const boundMoveTo = action.moveTo.bind(action)
        return { moveTo: boundMoveTo, if: boundIf, ...returnActions }
    }
    onEnter() {
        const actionType = '##enter##'
        const stateEvent = new StateEvent<IContext, IEvents>();
        this.stateEventsMap.set(actionType, stateEvent);
        this.stateJSON[actionType] = {
            target: this.value,
            isSetByDefault: true,
            cond: returnTrue
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this)
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent)
        const returnActions = action.returnStateEventActions()
        return { ...returnActions };
    }
    always() {
        const actionType = Symbol('##always##');
        const stateEvent = new StateEvent<IContext, IEvents>();
        this.stateEventsMap.set(actionType, stateEvent);
        this.stateJSON[actionType] = {
            target: this.value,
            isSetByDefault: true,
            cond: returnTrue
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this)
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent);
        const returnActions = action.returnStateEventActions();
        const boundIf = action.if.bind(action);
        const boundMoveTo = action.moveTo.bind(action)
        return { ...returnActions, if: boundIf, moveTo: boundMoveTo }
    }
    onExit() {
        const actionType = '##exit##';
        const stateEvent = new StateEvent<IContext, IEvents>();
        this.stateEventsMap.set(actionType, stateEvent);
        this.stateJSON[actionType] = {
            target: this.value,
            cond: returnTrue,
            isSetByDefault: true
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this)
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent);
        const returnActions = action.returnStateEventActions();
        return { ...returnActions }
    }
    after(time: number | TAfterCallback<IContext>) {
        this.delay = time;
        const actionType = '##after##';
        const stateEvent = new StateEvent<IContext, IEvents>()
        this.stateEventsMap.set(actionType, stateEvent)
        this.stateJSON[actionType] = {
            target: this.value,
            cond: returnTrue,
            isSetByDefault: true
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this)
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent)
        const returnActions = action.returnStateEventActions()
        const boundMoveTo = action.moveTo.bind(action)
        const boundIf = action.if.bind(action)
        return { ...returnActions, moveTo: boundMoveTo, if: boundIf }
    }
    getConfig() {
        const { stateEventsMap, stateJSON, callback, delay, asyncCallback } = this;
        return {
            callback,
            stateJSON,
            stateEventsMap,
            delay,
            asyncCallback
        }
    }
    invokeCallback(callback: (context: IContext, sendBack: TSendBack<IEvents>) => () => void) {
        this.callback = callback;
        const boundOn = this.on.bind(this);
        return { on: boundOn }
    }
    invokeAsyncCallback(callback: TAsyncCallback<IContext>) {
        this.asyncCallback = callback;
        const boundOnDone = this.#onDone.bind(this)
        const boundOnError = this.#onError.bind(this);
        return { onDone: boundOnDone, onError: boundOnError }
    }
}