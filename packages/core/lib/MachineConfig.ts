import { Action, TIf, TMoveTo } from "./Action";
import { State } from "./State";
import { StateEvent } from "./StateEvent";
import { IDefaultEvent, TDefaultContext, TDefaultStates, TStateEventCallback } from "./types";

type TStates<T extends readonly string[], IContext, IEvents extends IDefaultEvent> = {
    [TIndex in T[number]]: State<T, IContext, IEvents>
}

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

export function createEvents<T extends readonly string[]>(...args: T) {
    return args
}
export class MachineConfig<IStates extends TDefaultStates, IContext extends TDefaultContext, IEvents extends IDefaultEvent> {
    #states: TStates<IStates, IContext, IEvents> = {} as TStates<IStates, IContext, IEvents>;
    #context: IContext;
    #stateJSON: TStateJSON<IContext, IStates> = {};
    #stateEventsMap: Map<TActionType, StateEvent<IContext, IEvents>> = new Map();
    #actions: IEvents;

    constructor(states: IStates, newContext: IContext, actions: IEvents) {
        const defaultState: readonly string[] = ['##notYetDeclared##']
        this.#context = { ...newContext ?? {} };
        this.#addStates<typeof states>(states.length > 0 ? states : defaultState as IStates)
        this.#actions = actions
    }

    #addStates<U extends readonly string[]>(states: U): TStates<U, IContext, IEvents> {
        const newStates = states.reduce((acc, curr) => {
            return { ...acc, [curr]: new State<U, IContext, IEvents>(curr) };
        }, {} as TStates<U, IContext, IEvents>);
        this.#states = { ...this.#states, ...newStates };
        return newStates;
    }

    getStates(): TStates<IStates, IContext, IEvents> {
        return this.#states
    }

    #updateStateJSON(actionType: TActionType, payload: Partial<{
        target: TTargetState<IStates>,
        cond: TCond<IContext>,
        isSetByDefault: boolean
    }>) {
        const prev = this.#stateJSON[actionType];
        this.#stateJSON[actionType] = { ...prev, ...payload }
    }


    on(actionType: IEvents[number]): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        if: TIf<IContext, IStates, IEvents>,
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TStateEventCallback<IContext, IEvents, IContext>) => StateEvent<IContext, IEvents>
    } {
        const stateEvent = new StateEvent<IContext, IEvents>()
        this.#stateJSON[actionType] = {
            cond: returnTrue,
            isSetByDefault: true,
            target: '##notYetDeclared##'
        }
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this);
        const action = new Action<IContext, IStates, IEvents>(actionType, boundUpdateStateJSON, stateEvent)
        this.#stateEventsMap.set(actionType, stateEvent);
        const returnActions = action.returnStateEventActions()
        const boundIf = action.if.bind(action);
        const boundMoveTo = action.moveTo.bind(action)
        return { moveTo: boundMoveTo, if: boundIf, ...returnActions }
    }

    getConfig() {
        const actions = this.#actions;
        const states = this.#states;
        const context = this.#context
        const stateEventsMap = this.#stateEventsMap;
        const stateJSON = this.#stateJSON
        return {
            states, context, stateEventsMap, stateJSON, actions
        }
    }

}