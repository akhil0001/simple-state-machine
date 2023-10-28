import { State } from "./State";
import { TDefaultContext } from "./types";

type TStates<T extends PropertyKey[], IContext> = {
    [TIndex in T[number]]: State<IContext>
}

export class MachineConfig<IContext extends TDefaultContext> {
    states: TStates<string[], IContext> = {};
    context: IContext;

    constructor(newContext: IContext) {
        this.context = { ...newContext ?? {} };
    }

    addStates<T extends string>(states: T[]): TStates<T[], IContext> {
        const newStates = states.reduce((acc, curr) => {
            return { ...acc, [curr]: new State<IContext>(curr) };
        }, this.states);
        this.states = newStates;
        return newStates
    }


}