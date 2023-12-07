import { TDefaultContext, IDefaultEvent } from ".";
import { State } from "./State";

type TConvertArrToObj<TArr extends readonly string[]> = {
    [TIndex in TArr[number]]: TArr[number]
}

export type TTargetState<IStates extends readonly string[]> = keyof TConvertArrToObj<IStates>;

export type TCond<IContext> = (context: IContext) => boolean;

export type TStates<T extends readonly string[], IContext extends TDefaultContext, IEvents extends IDefaultEvent> = {
    [TIndex in T[number]]: State<T, IContext, IEvents>
}
