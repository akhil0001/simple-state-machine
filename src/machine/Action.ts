import { StateEvent } from "./StateEvent";
import { IDefaultEvent, TDefaultStates } from "./types";

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


export class Action<IContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> {

    protected actionType: TActionType = ''
    #stateEvent: StateEvent<IContext, IEvents> = new StateEvent<IContext, IEvents>();
    #updateStateJSON: TUpdateStateJSON<IContext, IStates>

    constructor(actionType: TActionType, updateStateJSON: TUpdateStateJSON<IContext, IStates>, stateEvent: StateEvent<IContext, IEvents>) {
        this.actionType = actionType
        this.#updateStateJSON = updateStateJSON;
        this.#stateEvent = stateEvent
    }
    if(cond: TCond<IContext>) {
        this.#updateStateJSON(this.actionType, { cond: cond })
        const boundMoveTo = this.moveTo.bind(this);
        return { moveTo: boundMoveTo }
    }
    returnStateEventActions() {
        const fireAndForget = this.#stateEvent.fireAndForget.bind(this.#stateEvent);
        const updateContext = this.#stateEvent.updateContext.bind(this.#stateEvent);
        return { fireAndForget, updateContext };
    }
    moveTo(target: TTargetState<IStates>) {
        this.#updateStateJSON(this.actionType, { target: target, isSetByDefault: false })
        const returnActions = this.returnStateEventActions()
        return { ...returnActions }
    }
}