import { Action, TIf, TMoveTo } from "./Action";
import { State, TStateJSON } from "./State";
import { StateEvent } from "./StateEvent";
import { MACHINE_SUPER_STATE } from "./constants";
import { TCond, TStates, TTargetState } from "./internalTypes";
import { IDefaultEvent, TAssignPayload, TDefaultContext, TDefaultStates, TStateEventCallback, TUpdateContextEventCallback } from "./types";


export function createEvents<T extends readonly string[]>(...args: T) {
    return args
}
export class MachineConfig<IStates extends TDefaultStates, IContext extends TDefaultContext, IEvents extends IDefaultEvent> {
    #states: TStates<IStates, IContext, IEvents> = {} as TStates<IStates, IContext, IEvents>;
    #context: IContext;
    #actions: IEvents;
    #stateJSON: TStateJSON<IContext, IStates, IEvents> = {}
    #id: Symbol;

    constructor(states: IStates, newContext: IContext, actions: IEvents) {
        const defaultState: readonly string[] = [MACHINE_SUPER_STATE]
        this.#context = { ...newContext ?? {} };
        this.#addStates<typeof states>(states.length > 0 ? states : defaultState as IStates)
        this.#actions = actions
        this.#id = Symbol();
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

    #updateStateJSON(actionType: symbol, payload: {
        target: TTargetState<IStates>,
        cond: TCond<IContext>,
        isSetByDefault: boolean,
        event: StateEvent<IContext, IEvents>
    }) {
        const prev = this.#stateJSON[actionType]?.[0] ?? {};
        this.#stateJSON[actionType] = [{ ...prev, ...payload }]
    }

    on(actionType: IEvents[number]): {
        moveTo: TMoveTo<IContext, IStates, IEvents>,
        if: TIf<IContext, IStates, IEvents>,
        fireAndForget: (cb: TStateEventCallback<IContext, IEvents, void>) => StateEvent<IContext, IEvents>,
        updateContext: (cb: TAssignPayload<IContext, IEvents> | TUpdateContextEventCallback<IContext, IEvents>) => StateEvent<IContext, IEvents>
    } {
        const boundUpdateStateJSON = this.#updateStateJSON.bind(this)
        const action = new Action<IContext, IStates, IEvents>(actionType, MACHINE_SUPER_STATE, boundUpdateStateJSON);

        const boundMoveTo = action.moveTo.bind(action);
        const boundIf = action.if.bind(action);
        const returnActions = action.returnStateEventActions();
        return {
            moveTo: boundMoveTo,
            if: boundIf,
            ...returnActions
        }
    }


    getConfig() {
        const actions = this.#actions;
        const states = this.#states;
        const context = this.#context
        const stateJSON = this.#stateJSON
        const id = this.#id
        return {
            states, context, actions, stateJSON, id
        }
    }

}