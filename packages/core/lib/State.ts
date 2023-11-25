/* eslint-disable @typescript-eslint/no-explicit-any */
import { Action, TIf, TMoveTo } from "./Action";
import { StateEvent } from "./StateEvent";
import { TCond, TTargetState } from "./internalTypes";
import { IDefaultEvent, TAfterCallback, TAssignPayload, TAsyncCallback, TCallback, TDefaultContext, TSendBack, TStateEventCallback, TUpdateContextEventCallback } from "./types";

export type TStateJSON<IContext extends TDefaultContext, IStates extends readonly string[], IEvents extends IDefaultEvent> = {
    [key: symbol]: Array<{
        target: TTargetState<IStates>,
        cond: TCond<IContext>,
        isSetByDefault: boolean
        event: StateEvent<IContext, IEvents>
        delay?: number | TAfterCallback<IContext>
    }>
}


export class State<IStates extends readonly string[], IContext extends TDefaultContext, IEvents extends readonly string[]> {
    #value: string = '';
    #stateJSON: TStateJSON<IContext, IStates, IEvents> = {}
    #callback: TCallback<IContext, IEvents> = () => () => { };
    #asyncCallback: TAsyncCallback<IContext> = () => new Promise(res => res(null));

    constructor(val: string) {
        this.#value = val;
    }

    #updateStateJSON(actionType: symbol, payload: {
        target: TTargetState<IStates>,
        cond: TCond<IContext>,
        isSetByDefault: boolean,
        event: StateEvent<IContext, IEvents>
    }) {
        const prev = this.#stateJSON[actionType]?.[0] ?? {};
        this.#stateJSON[actionType] = [{ ...prev, ...payload }]
    }

    #commonLogic(actionType: IEvents[number], delay: number | TAfterCallback<IContext> = 0): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        if: TIf<IContext, IStates, IEvents>,
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>
    } {
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this);
        const action = new Action<IContext, IStates, IEvents>(actionType, this.#value, boundUpdateStateJSON, delay);
        const returnActions = action.returnStateEventActions()
        const boundMoveTo = action.moveTo.bind(action)
        const boundIf = action.if.bind(action)
        return { ...returnActions, moveTo: boundMoveTo, if: boundIf }
    }

    #onDone(): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (payload: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>
    } {
        const { moveTo, fireAndForget, updateContext } = this.#commonLogic('##onDone##')
        return { moveTo, fireAndForget, updateContext }
    }

    #onError(): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (payload: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>
    } {
        const { moveTo, fireAndForget, updateContext } = this.#commonLogic('##onError##')
        return { moveTo, fireAndForget, updateContext }
    }

    on(actionType: IEvents[number]): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        if: TIf<IContext, IStates, IEvents>
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (payload: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>
    } {
        const { moveTo, fireAndForget, updateContext, if: If } = this.#commonLogic(actionType)
        return { moveTo, fireAndForget, updateContext, if: If }
    }
    onEnter(): {
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (payload: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>
    } {
        const { fireAndForget, updateContext } = this.#commonLogic('##enter##')
        return { fireAndForget, updateContext }
    }
    always(): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        if: TIf<IContext, IStates, IEvents>
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (payload: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>
    } {
        const { moveTo, if: If, fireAndForget, updateContext } = this.#commonLogic('##always##')
        return { moveTo, if: If, fireAndForget, updateContext }
    }
    onExit(): {
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (payload: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>
    } {
        const { fireAndForget, updateContext } = this.#commonLogic('##exit##')
        return { fireAndForget, updateContext }
    }
    after(time: number | TAfterCallback<IContext>): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        if: TIf<IContext, IStates, IEvents>
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (payload: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>
    } {
        const { moveTo, if: If, fireAndForget, updateContext } = this.#commonLogic('##after##', time)
        return { moveTo, if: If, fireAndForget, updateContext }
    }
    getConfig() {
        return {
            callback: this.#callback,
            stateJSON: this.#stateJSON,
            asyncCallback: this.#asyncCallback,
            value: this.#value
        }
    }
    invokeCallback(callback: (context: IContext, sendBack: TSendBack<IEvents>) => () => void): {
        on: (actionType: IEvents[number]) => {
            moveTo: TMoveTo<IContext, IStates, IEvents>,
            if: TIf<IContext, IStates, IEvents>
            fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
            updateContext: (payload: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>
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
            updateContext: (payload: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>
        },
        onError: () => {
            moveTo: TMoveTo<IContext, IStates, IEvents>,
            fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
            updateContext: (payload: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>
        }
    } {
        this.#asyncCallback = callback;
        const boundOnDone = this.#onDone.bind(this)
        const boundOnError = this.#onError.bind(this);
        return { onDone: boundOnDone, onError: boundOnError }
    }
}