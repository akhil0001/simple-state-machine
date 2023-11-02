/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Do we have a way to avoid `any` and have all primitive types instead
export type TDefaultContext = {
    [key: string]: any;
}

export type TDefaultStates = readonly string[]

export type TDefaultEvent = {
    type: string;
    data?: {
        [key: string]: any;
    }
}

type TStateEventCallback<IContext, ReturnType> = (context: IContext, event: TDefaultEvent) => ReturnType;

export type TStateEvent<IContext> = {
    type: 'fireAndForget'
    callback: TStateEventCallback<IContext, void>
} | {
    type: 'updateContext',
    callback: TStateEventCallback<IContext, IContext>
}
export type TSendBack = (actionType: string) => void

export type TCallback<IContext> = (context: IContext, sendBack: TSendBack) => () => void;
