import { State } from "./State";
import { TDefaultContext } from "./types";

type TStates<T extends string[], IContext> = {
    [TIndex in T[number]]: State<IContext, T>
}

export class MachineConfig<IContext extends TDefaultContext> {
    states: TStates<string[], IContext> = {};
    context: IContext;

    constructor(newContext: IContext) {
        this.context = { ...newContext ?? {} };
    }

    addStates<T extends string>(states: readonly T[]): TStates<T[], IContext> {
        const newStates = states.reduce((acc, curr) => {
            return { ...acc, [curr]: new State<IContext, T[]>(curr) };
        }, this.states as TStates<T[], IContext>);
        this.states = newStates;
        return newStates
    }

}