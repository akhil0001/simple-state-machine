import { StateEvent } from "./StateEvent";
import { TCond, TTargetState } from "./internalTypes";
import { IDefaultEvent, TAfterCallback, TAssignPayload, TDefaultContext, TDefaultStates, TStateEventCallback, TUpdateContextEventCallback } from "./types";

export type TStateJSONPayload<IContext extends TDefaultContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> = {
    target: TTargetState<IStates>,
    cond: TCond<IContext>,
    isSetByDefault: boolean;
    event: StateEvent<IContext, IEvents>,
    delay: number | TAfterCallback<IContext>
}

type TUpdateStateJSON<IContext extends TDefaultContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> = (actionType: symbol, payload: TStateJSONPayload<IContext, IStates, IEvents>) => void

export type TReturnStateEventActions<IContext extends TDefaultContext, IEvents extends IDefaultEvent> = () => {
    fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>;
    updateContext: (payload: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>;
}

export type TMoveTo<IContext extends TDefaultContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> = (target: TTargetState<IStates>) => ReturnType<TReturnStateEventActions<IContext, IEvents>>;

export type TIf<IContext extends TDefaultContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> = (cond: TCond<IContext>) => {
    moveTo: TMoveTo<IContext, IStates, IEvents>
}

const returnTrue = () => true;
export class Action<IContext extends TDefaultContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> {

    #actionType: symbol;
    #stateEvent: StateEvent<IContext, IEvents>;
    #updateStateJSON: TUpdateStateJSON<IContext, IStates, IEvents>
    #stateJSONPayload: TStateJSONPayload<IContext, IStates, IEvents>;

    constructor(actionType: IEvents[number], currentState: IStates[number], updateStateJSON: TUpdateStateJSON<IContext, IStates, IEvents>, delay: number | TAfterCallback<IContext> = 0) {
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