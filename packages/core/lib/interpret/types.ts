import { TDefaultStates, TDefaultContext, IDefaultEvent } from "../types"
import { MACHINE_SUPER_STATE } from "../constants";

export type TMatchesAnyParams<U extends TDefaultStates> = Array<U[number] | typeof MACHINE_SUPER_STATE | "">
export type TMatchesAny<U extends TDefaultStates> = (...args: TMatchesAnyParams<U>) => boolean

export type TReturnState<U extends TDefaultStates, V extends TDefaultContext> = {
    value: U[number],
    context: V,
    matchesAny: TMatchesAny<U>;
}

export type TSubscribeCallback<U extends TDefaultStates, V extends TDefaultContext> = (state: TReturnState<U, V>) => unknown

export type TInterpretInternalState = {
    value: 'hibernating' | 'active'
}

export type TInterpretReturn<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent> = {
    state: TReturnState<U, V>,
    send: (eventName: W[number], data?: object) => void;
    subscribe: (cb: TSubscribeCallback<U, V>) => () => void;
    start: () => void
}

export type ALL_EVENTS<W extends IDefaultEvent> = ['##update##' | "##updateContext##" | "##permitToEnterNewState##" | W[number]];
