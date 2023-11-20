/* eslint-disable @typescript-eslint/no-explicit-any */
import { Action, TIf, TMoveTo } from "./Action";
import { StateEvent } from "./StateEvent";
import { TAfterCallback, TAsyncCallback, TCallback, TSendBack, TStateEventCallback } from "./types";


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

export class State<IContext, AllStates extends readonly string[], IEvents extends readonly string[]> {
    #value: string = '';
    #stateJSON: TStateJSON<IContext, AllStates> = {}
    #stateEventsMap: Map<TActionType, StateEvent<IContext, IEvents>> = new Map();
    #callback: TCallback<IContext, IEvents> = () => () => { };
    #asyncCallback: TAsyncCallback<IContext> = () => new Promise(res => res(null));
    #delay: number | TAfterCallback<IContext> = 0;

    constructor(val: string) {
        this.#value = val;
    }

    #updateStateJSON(actionType: TActionType, payload: Partial<{
        target: TTargetState<AllStates>,
        cond: TCond<IContext>,
        isSetByDefault: boolean
    }>) {
        const prev = this.#stateJSON[actionType];
        this.#stateJSON[actionType] = { ...prev, ...payload }
    }

    #onDone(): {
        moveTo: TMoveTo<IContext, AllStates, IEvents>,
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const stateEvent = new StateEvent<IContext, IEvents>()
        const actionType = Symbol('##onDone##');
        this.#stateEventsMap.set(actionType, stateEvent);
        this.#stateJSON[actionType] = {
            target: this.#value,
            isSetByDefault: true,
            cond: returnTrue
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this);
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent);
        const returnActions = action.returnStateEventActions()
        const boundMoveTo = action.moveTo.bind(action)
        return { moveTo: boundMoveTo, ...returnActions }
    }

    #onError(): {
        moveTo: TMoveTo<IContext, AllStates, IEvents>,
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const stateEvent = new StateEvent<IContext, IEvents>()
        const actionType = Symbol('##onError##');
        this.#stateEventsMap.set(actionType, stateEvent);
        this.#stateJSON[actionType] = {
            target: this.#value,
            isSetByDefault: true,
            cond: returnTrue
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this);
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent);
        const returnActions = action.returnStateEventActions()
        const boundMoveTo = action.moveTo.bind(action)
        return { moveTo: boundMoveTo, ...returnActions }
    }

    on(actionType: IEvents[number]): {
        moveTo: TMoveTo<IContext, AllStates, IEvents>,
        if: TIf<IContext, AllStates, IEvents>
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const stateEvent = new StateEvent<IContext, IEvents>();
        this.#stateJSON[actionType] = {
            target: this.#value,
            cond: returnTrue,
            isSetByDefault: true
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this);
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent)
        this.#stateEventsMap.set(actionType, stateEvent);
        const returnActions = action.returnStateEventActions()
        const boundIf = action.if.bind(action)
        const boundMoveTo = action.moveTo.bind(action)
        return { moveTo: boundMoveTo, if: boundIf, ...returnActions }
    }
    onEnter(): {
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const actionType = '##enter##'
        const stateEvent = new StateEvent<IContext, IEvents>();
        this.#stateEventsMap.set(actionType, stateEvent);
        this.#stateJSON[actionType] = {
            target: this.#value,
            isSetByDefault: true,
            cond: returnTrue
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this)
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent)
        const returnActions = action.returnStateEventActions()
        return { ...returnActions };
    }
    always(): {
        moveTo: TMoveTo<IContext, AllStates, IEvents>,
        if: TIf<IContext, AllStates, IEvents>
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const actionType = Symbol('##always##');
        const stateEvent = new StateEvent<IContext, IEvents>();
        this.#stateEventsMap.set(actionType, stateEvent);
        this.#stateJSON[actionType] = {
            target: this.#value,
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
    onExit(): {
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const actionType = '##exit##';
        const stateEvent = new StateEvent<IContext, IEvents>();
        this.#stateEventsMap.set(actionType, stateEvent);
        this.#stateJSON[actionType] = {
            target: this.#value,
            cond: returnTrue,
            isSetByDefault: true
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this)
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent);
        const returnActions = action.returnStateEventActions();
        return { ...returnActions }
    }
    after(time: number | TAfterCallback<IContext>): {
        moveTo: TMoveTo<IContext, AllStates, IEvents>,
        if: TIf<IContext, AllStates, IEvents>
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        this.#delay = time;
        const actionType = '##after##';
        const stateEvent = new StateEvent<IContext, IEvents>()
        this.#stateEventsMap.set(actionType, stateEvent)
        this.#stateJSON[actionType] = {
            target: this.#value,
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
            moveTo: TMoveTo<IContext, AllStates, IEvents>,
            if: TIf<IContext, AllStates, IEvents>
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
            moveTo: TMoveTo<IContext, AllStates, IEvents>,
            fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
            updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
        },
        onError: () => {
            moveTo: TMoveTo<IContext, AllStates, IEvents>,
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