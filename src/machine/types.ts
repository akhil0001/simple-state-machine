/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Do we have a way to avoid `any` and have all primitive types instead
export type TDefaultContext = {
    [key: string]: any;
}

export type TDefaultStates = readonly string[]

export interface IDefaultEvent {
    type: string | symbol;
    data?: {
        [key: string]: any;
    }
}

type TStateEventCallback<IContext, IEvents, ReturnType> = (context: IContext, event: IEvents) => ReturnType;

export type TFireAndForgetEventCallback<IContext, IEvents> = TStateEventCallback<IContext, IEvents, void>
export type TUpdateContextEventCallback<IContext, IEvents> = TStateEventCallback<IContext, IEvents, IContext>

export type TStateEvent<IContext, IEvents> = {
    type: 'fireAndForget'
    callback: TStateEventCallback<IContext, IEvents, void>
} | {
    type: 'updateContext',
    callback: TStateEventCallback<IContext, IEvents, IContext>
}
export type TSendBack = (actionType: string) => void

export type TCallback<IContext> = (context: IContext, sendBack: TSendBack) => () => void;
