import { Action } from "./Action";
import { State } from "./State";
import { StateEvent } from "./StateEvent";
import { IDefaultEvent, TDefaultContext, TDefaultStates } from "./types";

type TStates<T extends readonly string[], IContext, IEvents extends IDefaultEvent> = {
    [TIndex in T[number]]: State<IContext, T, IEvents>
} | Record<string, State<IContext, T, IEvents>>

type TConvertArrToObj<TArr extends readonly string[]> = {
    [TIndex in TArr[number]]: TArr[number]
}

type TCond<IContext> = (context: IContext) => boolean;

type TTargetState<AllStates extends readonly string[]> = keyof TConvertArrToObj<AllStates>;

type TActionType = string | symbol;

type TStateJSON<IContext, IStates extends readonly string[]> = {
    [key: TActionType]: {
        target: TTargetState<IStates>,
        cond: TCond<IContext>,
        isSetByDefault: boolean
    }
}

const returnTrue = () => true;

export class MachineConfig<IContext extends TDefaultContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> {
    protected states: TStates<IStates, IContext, IEvents> = {};
    protected context: IContext;
    protected stateJSON: TStateJSON<IContext, IStates> = {};
    protected stateEventsMap: Map<TActionType, StateEvent<IContext, IEvents>> = new Map();

    constructor(newContext: IContext) {
        this.context = { ...newContext ?? {} };
    }

    addStates(states: IStates): TStates<IStates, IContext, IEvents> {
        const newStates = states.reduce((acc, curr) => {
            return { ...acc, [curr]: new State<IContext, IStates, IEvents>(curr) };
        }, this.states as TStates<IStates, IContext, IEvents>);
        this.states = newStates;
        return newStates
    }

    #updateStateJSON(actionType: TActionType, payload: Partial<{
        target: TTargetState<IStates>,
        cond: TCond<IContext>,
        isSetByDefault: boolean
    }>) {
        const prev = this.stateJSON[actionType];
        this.stateJSON[actionType] = { ...prev, ...payload }
    }


    on(actionType: IEvents['type']) {
        const stateEvent = new StateEvent<IContext, IEvents>()
        this.stateJSON[actionType] = {
            cond: returnTrue,
            isSetByDefault: true,
            target: '##notYetDeclared##'
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this)
        const action = new Action(actionType, boundUpdateStateJSON, stateEvent)
        this.stateEventsMap.set(actionType, stateEvent);
        const returnActions = action.returnStateEventActions()
        const boundIf = action.if.bind(action);
        const boundMoveTo = action.moveTo.bind(action)
        return { moveTo: boundMoveTo, if: boundIf, ...returnActions }
    }

    getConfig() {
        const { states, context, stateEventsMap, stateJSON } = this
        return {
            states, context, stateEventsMap, stateJSON
        }
    }

}