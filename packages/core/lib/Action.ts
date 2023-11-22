import { StateEvent } from "./StateEvent";
import { IDefaultEvent, TAfterCallback, TDefaultStates, TStateEventCallback } from "./types";

type TConvertArrToObj<TArr extends readonly string[]> = {
    [TIndex in TArr[number]]: TArr[number]
}

type TCond<IContext> = (context: IContext) => boolean;

type TTargetState<AllStates extends readonly string[]> = keyof TConvertArrToObj<AllStates>;


export type TStateJSONPayload<IContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> = {
    target: TTargetState<IStates>,
    cond: TCond<IContext>,
    isSetByDefault: boolean;
    event: StateEvent<IContext, IEvents>,
    delay: number | TAfterCallback<IContext>
}

type TUpdateStateJSON<IContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> = (actionType: symbol, payload: TStateJSONPayload<IContext, IStates, IEvents>) => void

export type TReturnStateEventActions<IContext, IEvents extends IDefaultEvent> = () => {
    fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>;
    updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>;
}

export type TMoveTo<IContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> = (target: TTargetState<IStates>) => ReturnType<TReturnStateEventActions<IContext, IEvents>>;

export type TIf<IContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> = (cond: TCond<IContext>) => {
    moveTo: TMoveTo<IContext, IStates, IEvents>
}

const returnTrue = () => true;
export class Action<IContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> {

    #actionType: symbol;
    #stateEvent: StateEvent<IContext, IEvents>;
    #updateStateJSON: TUpdateStateJSON<IContext, IStates, IEvents>
    #stateJSONPayload: TStateJSONPayload<IContext, IStates, IEvents>;

    constructor(actionType: IEvents[number], currentState: IStates[number], updateStateJSON: TUpdateStateJSON<IContext, IStates, IEvents>, delay: number | TAfterCallback<IContext>) {
        this.#actionType = Symbol(actionType);
        this.#updateStateJSON = updateStateJSON;
        const boundUpdateDefaultStateJSON = this.#updateDefaultStateJSON.bind(this)
        this.#stateEvent = new StateEvent<IContext, IEvents>(boundUpdateDefaultStateJSON);
        this.#stateJSONPayload = {
            target: currentState,
            cond: returnTrue,
            isSetByDefault: true,
            event: this.#stateEvent,
            delay: delay
        }
    }
    #updateDefaultStateJSON() {
        this.#updateStateJSON(this.#actionType, this.#stateJSONPayload)
    }
    if(cond: TCond<IContext>): ReturnType<TIf<IContext, IStates, IEvents>> {
        this.#stateJSONPayload = { ...this.#stateJSONPayload, cond: cond };
        this.#updateStateJSON(this.#actionType, this.#stateJSONPayload)
        const boundMoveTo = this.moveTo.bind(this);
        return { moveTo: boundMoveTo }
    }
    returnStateEventActions(): ReturnType<TReturnStateEventActions<IContext, IEvents>> {
        const fireAndForget = this.#stateEvent.fireAndForget.bind(this.#stateEvent);
        const updateContext = this.#stateEvent.updateContext.bind(this.#stateEvent);
        return { fireAndForget, updateContext };
    }
    moveTo(target: TTargetState<IStates>): ReturnType<TMoveTo<IContext, IStates, IEvents>> {
        this.#stateJSONPayload = { ...this.#stateJSONPayload, target: target, isSetByDefault: false }
        this.#updateStateJSON(this.#actionType, this.#stateJSONPayload)
        const returnActions = this.returnStateEventActions()
        return { ...returnActions }
    }
}