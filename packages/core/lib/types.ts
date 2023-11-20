/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Do we have a way to avoid `any` and have all primitive types instead
export type TDefaultContext = {
    [key: string]: any;
}

export type TDefaultStates = readonly string[]

export type IDefaultEvent = readonly string[];
export type TStateEventCallback<IContext, IEvents extends IDefaultEvent, ReturnType> = (context: IContext, event: { type: IEvents[number] | symbol, data: Record<string, any> }) => ReturnType;

export type TFireAndForgetEventCallback<IContext, IEvents extends IDefaultEvent> = TStateEventCallback<IContext, IEvents, void>
export type TUpdateContextEventCallback<IContext, IEvents extends IDefaultEvent> = TStateEventCallback<IContext, IEvents, IContext>

export type TStateEvent<IContext, IEvents extends IDefaultEvent> = {
    type: 'fireAndForget'
    callback: TStateEventCallback<IContext, IEvents, void>
} | {
    type: 'updateContext',
    callback: TStateEventCallback<IContext, IEvents, IContext>
}
export type TSendBack<IEvents extends IDefaultEvent> = (action: { type: IEvents[number], data?: Record<string, any> } | IEvents[number]) => void

export type TCallback<IContext, IEvents extends IDefaultEvent> = (context: IContext, sendBack: TSendBack<IEvents>) => () => void;

export type TAsyncCallback<IContext> = (context: IContext) => Promise<any>

export type TAfterCallback<IContext> = (context: IContext) => number;

export type TCurrentState<U extends TDefaultStates, V> = {
    value: U[number];
    history: U[number];
    context: V
}