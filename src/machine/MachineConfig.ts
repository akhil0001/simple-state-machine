import { State } from "./State";
import { TDefaultContext } from "./types";

type TStates<T extends PropertyKey[], IContext> = {
    [TIndex in T[number]]: State<IContext>
}

export class MachineConfig<IContent extends TDefaultContext> {
    states: TStates<string[], IContent> = {};
    context: IContent;
    initialState: State<IContent> = new State('init');

    constructor(newContext: IContent) {
        this.context = { ...newContext ?? {} };
    }

    addStates<T extends string>(states: T[]): TStates<T[], IContent> {
        const newStates = states.reduce((acc, curr) => {
            return { ...acc, [curr]: new State<IContent>(curr) };
        }, this.states);
        this.states = newStates;
        return newStates
    }

}