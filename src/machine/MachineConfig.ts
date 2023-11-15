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
        target: TTargetState<IStates> | null,
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
    #stateEvent: StateEvent<IContext, IEvents> = new StateEvent<IContext, IEvents>();
    #chainedActionType: TActionType = '';

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
    #moveTo(target: TTargetState<IStates>) {
        this.stateJSON[this.#chainedActionType].target = target;
        this.stateJSON[this.#chainedActionType].isSetByDefault = false;
        const returnActions = this.#returnStateEventActions()
        return { ...returnActions }
    }

    on(actionType: IEvents['type']) {
        const stateEvent = new StateEvent<IContext, IEvents>();
        this.#stateEvent = stateEvent;
        this.#chainedActionType = actionType;
        this.stateJSON[actionType] = {
            target: null,
            isSetByDefault: true,
            cond: returnTrue
        }
        this.stateEventsMap.set(actionType, this.#stateEvent);
        const returnActions = this.#returnStateEventActions()
        const boundIf = this.#if.bind(this)
        return { moveTo: this.#moveTo.bind(this), if: boundIf, ...returnActions }
    }

    getConfig() {
        const { states, context, stateEventsMap, stateJSON } = this
        return {
            states, context, stateEventsMap, stateJSON
        }
    }

}