import { StateEvent } from "./StateEvent";
import { IDefaultEvent, TDefaultStates, TStateEventCallback } from "./types";

type TConvertArrToObj<TArr extends readonly string[]> = {
    [TIndex in TArr[number]]: TArr[number]
}

type TCond<IContext> = (context: IContext) => boolean;

type TTargetState<AllStates extends readonly string[]> = keyof TConvertArrToObj<AllStates>;

type TActionType = string | symbol;

type TUpdateStateJSON<IContext, IStates extends readonly string[]> = (actionType: TActionType, payload: Partial<{
    target: TTargetState<IStates>,
    cond: TCond<IContext>,
    isSetByDefault: boolean
}>) => void

export type TReturnStateEventActions<IContext, IEvents extends IDefaultEvent> = () => {
    fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>;
    updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>;
}

export type TMoveTo<IContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> = (target: TTargetState<IStates>) => ReturnType<TReturnStateEventActions<IContext, IEvents>>;

export type TIf<IContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> = (cond: TCond<IContext>) => {
    moveTo: TMoveTo<IContext, IStates, IEvents>
}

export class Action<IContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> {

    protected actionType: TActionType = ''
    #stateEvent: StateEvent<IContext, IEvents> = new StateEvent<IContext, IEvents>();
    #updateStateJSON: TUpdateStateJSON<IContext, IStates>

    constructor(actionType: TActionType, updateStateJSON: TUpdateStateJSON<IContext, IStates>, stateEvent: StateEvent<IContext, IEvents>) {
        this.actionType = actionType
        this.#updateStateJSON = updateStateJSON;
        this.#stateEvent = stateEvent
    }
    if(cond: TCond<IContext>): ReturnType<TIf<IContext, IStates, IEvents>> {
        this.#updateStateJSON(this.actionType, { cond: cond })
        const boundMoveTo = this.moveTo.bind(this);
        return { moveTo: boundMoveTo }
    }
    returnStateEventActions(): ReturnType<TReturnStateEventActions<IContext, IEvents>> {
        const fireAndForget = this.#stateEvent.fireAndForget.bind(this.#stateEvent);
        const updateContext = this.#stateEvent.updateContext.bind(this.#stateEvent);
        return { fireAndForget, updateContext };
    }
    moveTo(target: TTargetState<IStates>): ReturnType<TMoveTo<IContext, IStates, IEvents>> {
        this.#updateStateJSON(this.actionType, { target: target, isSetByDefault: false })
        const returnActions = this.returnStateEventActions()
        return { ...returnActions }
    }
}