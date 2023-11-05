import { State } from "./State";
import { IDefaultEvent, TDefaultContext, TDefaultStates } from "./types";

type TStates<T extends readonly string[], IContext, IEvents extends IDefaultEvent> = {
    [TIndex in T[number]]: State<IContext, T, IEvents>
} | Record<string, State<IContext, T, IEvents>>


export class MachineConfig<IContext extends TDefaultContext, IStates extends TDefaultStates, IEvents extends IDefaultEvent> {
    states: TStates<IStates, IContext, IEvents> = {};
    context: IContext;

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

}