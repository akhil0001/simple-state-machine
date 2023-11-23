import { State } from "./State";
import { IDefaultEvent, TDefaultContext, TDefaultStates } from "./types";

type TStates<T extends readonly string[], IContext extends TDefaultContext, IEvents extends IDefaultEvent> = {
    [TIndex in T[number]]: State<T, IContext, IEvents>
}

export function createEvents<T extends readonly string[]>(...args: T) {
    return args
}
export class MachineConfig<IStates extends TDefaultStates, IContext extends TDefaultContext, IEvents extends IDefaultEvent> {
    #states: TStates<IStates, IContext, IEvents> = {} as TStates<IStates, IContext, IEvents>;
    #context: IContext;
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


    getConfig() {
        const actions = this.#actions;
        const states = this.#states;
        const context = this.#context
        return {
            states, context, actions
        }
    }

}