import { State } from "./State";
import { TDefaultContext, TDefaultStates } from "./types";

type TStates<T extends readonly string[], IContext> = {
    [TIndex in T[number]]: State<IContext, T>
} | Record<string, State<IContext, T>>


export class MachineConfig<IContext extends TDefaultContext, IStates extends TDefaultStates> {
    states: TStates<IStates, IContext> = {};
    context: IContext;

    constructor(newContext: IContext) {
        this.context = { ...newContext ?? {} };
    }

    addStates(states: IStates): TStates<IStates, IContext> {
        const newStates = states.reduce((acc, curr) => {
            return { ...acc, [curr]: new State<IContext, IStates>(curr) };
        }, this.states as TStates<IStates, IContext>);
        this.states = newStates;
        return newStates
    }

}