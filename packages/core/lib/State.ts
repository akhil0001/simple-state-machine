/* eslint-disable @typescript-eslint/no-explicit-any */
import { Action, TIf, TMoveTo } from "./Action";
import { StateEvent } from "./StateEvent";
import { TAfterCallback, TAsyncCallback, TCallback, TSendBack, TStateEventCallback } from "./types";


type TConvertArrToObj<TArr extends readonly string[]> = {
    [TIndex in TArr[number]]: TArr[number]
}

type TTargetState<IStates extends readonly string[]> = keyof TConvertArrToObj<IStates>;

type TCond<IContext> = (context: IContext) => boolean;

type TActionType = string | symbol;

type TStateJSON<IContext, IStates extends readonly string[]> = {
    [key: TActionType]: {
        target: TTargetState<IStates>,
        cond: TCond<IContext>,
        isSetByDefault: boolean
    }
}

const returnTrue = () => true;

export class State<IStates extends readonly string[], IContext, IEvents extends readonly string[]> {
    #value: string = '';
    #stateJSON: TStateJSON<IContext, IStates> = {}
    #stateEventsMap: Map<TActionType, StateEvent<IContext, IEvents>> = new Map();
    #callback: TCallback<IContext, IEvents> = () => () => { };
    #asyncCallback: TAsyncCallback<IContext> = () => new Promise(res => res(null));
    #delay: number | TAfterCallback<IContext> = 0;

    constructor(val: string) {
        this.#value = val;
    }

    #updateStateJSON(actionType: TActionType, payload: Partial<{
        target: TTargetState<IStates>,
        cond: TCond<IContext>,
        isSetByDefault: boolean
    }>) {
        const prev = this.#stateJSON[actionType];
        this.#stateJSON[actionType] = { ...prev, ...payload }
    }

    #commonLogic(actionType: IEvents[number] | symbol) {
        const stateEvent = new StateEvent<IContext, IEvents>()
        this.#stateEventsMap.set(actionType, stateEvent);
        const stateJSONPayload = {
            target: this.#value,
            isSetByDefault: true,
            cond: returnTrue
        }
        this.#stateJSON[actionType] = stateJSONPayload
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this);
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent, stateJSONPayload);
        const returnActions = action.returnStateEventActions()
        const boundMoveTo = action.moveTo.bind(action)
        const boundIf = action.if.bind(action)
        return { ...returnActions, moveTo: boundMoveTo, if: boundIf }
    }

    #onDone(): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const { moveTo, fireAndForget, updateContext } = this.#commonLogic(Symbol('##onDone##'))
        return { moveTo, fireAndForget, updateContext }
    }

    #onError(): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const { moveTo, fireAndForget, updateContext } = this.#commonLogic(Symbol('##onError##'))
        return { moveTo, fireAndForget, updateContext }
    }

    on(actionType: IEvents[number]): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        if: TIf<IContext, IStates, IEvents>
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const { moveTo, fireAndForget, updateContext, if: If } = this.#commonLogic(actionType)
        return { moveTo, fireAndForget, updateContext, if: If }
    }
    onEnter(): {
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const { fireAndForget, updateContext } = this.#commonLogic(Symbol('##enter##'))
        return { fireAndForget, updateContext }
    }
    always(): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        if: TIf<IContext, IStates, IEvents>
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const { moveTo, if: If, fireAndForget, updateContext } = this.#commonLogic(Symbol('##always##'))
        return { moveTo, if: If, fireAndForget, updateContext }
    }
    onExit(): {
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const { fireAndForget, updateContext } = this.#commonLogic(Symbol('##exit##'))
        return { fireAndForget, updateContext }
    }
    after(time: number | TAfterCallback<IContext>): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        if: TIf<IContext, IStates, IEvents>
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        this.#delay = time;
        const { moveTo, if: If, fireAndForget, updateContext } = this.#commonLogic(Symbol('##after##'))
        return { moveTo, if: If, fireAndForget, updateContext }
    }
    getConfig() {
        return {
            callback: this.#callback,
            stateJSON: this.#stateJSON,
            stateEventsMap: this.#stateEventsMap,
            delay: this.#delay,
            asyncCallback: this.#asyncCallback,
            value: this.#value
        }
    }
    invokeCallback(callback: (context: IContext, sendBack: TSendBack<IEvents>) => () => void): {
        on: (actionType: IEvents[number]) => {
            moveTo: TMoveTo<IContext, IStates, IEvents>,
            if: TIf<IContext, IStates, IEvents>
            fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
            updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
        }
    } {
        this.#callback = callback;
        const boundOn = this.on.bind(this);
        return { on: boundOn }
    }
    invokeAsyncCallback(callback: TAsyncCallback<IContext>): {
        onDone: () => {
            moveTo: TMoveTo<IContext, IStates, IEvents>,
            fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
            updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
        },
        onError: () => {
            moveTo: TMoveTo<IContext, IStates, IEvents>,
            fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
            updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
        }
    } {
        this.#asyncCallback = callback;
        const boundOnDone = this.#onDone.bind(this)
        const boundOnError = this.#onError.bind(this);
        return { onDone: boundOnDone, onError: boundOnError }
    }
}