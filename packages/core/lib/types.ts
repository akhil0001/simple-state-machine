/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Do we have a way to avoid `any` and have all primitive types instead
export type TDefaultContext = {
    [key: string]: any;
}

export type TDefaultStates = readonly string[]

export type IDefaultEvent = readonly string[];
export type TEventPayload<IEvents extends IDefaultEvent> = { type: IEvents[number] | symbol, data: Record<string, any> }
export type TStateEventCallback<IContext, IEvents extends IDefaultEvent, ReturnType> = (context: IContext, event: TEventPayload<IEvents>) => Partial<ReturnType>;

export type TAssignPayload<IContext extends TDefaultContext, IEvents extends IDefaultEvent> = Partial<{
    [some in keyof IContext]: IContext[some] | ((context: IContext, payload: TEventPayload<IEvents>) => IContext[some])
}>;


export type TFireAndForgetEventCallback<IContext, IEvents extends IDefaultEvent> = TStateEventCallback<IContext, IEvents, void>
export type TUpdateContextEventCallback<IContext, IEvents extends IDefaultEvent> = TStateEventCallback<IContext, IEvents, IContext>

export type TAssign<IContext extends TDefaultContext, IEvents extends IDefaultEvent> = (payload: TAssignPayload<IContext, IEvents>) => TUpdateContextEventCallback<IContext, IEvents>

export type TStateEvent<IContext extends TDefaultContext, IEvents extends IDefaultEvent> = {
    type: 'fireAndForget'
    callback: TStateEventCallback<IContext, IEvents, void>
} | {
    type: 'updateContext',
    callback: TUpdateContextEventCallback<IContext, IEvents>
}
export type TSendBack<IEvents extends IDefaultEvent> = (action: { type: IEvents[number], data?: Record<string, any> } | IEvents[number]) => void

export type TCallback<IContext, IEvents extends IDefaultEvent> = (context: IContext, sendBack: TSendBack<IEvents>) =>(() => any)| any;

export type TAsyncCallback<IContext> = (context: IContext) => Promise<any>

export type TAfterCallback<IContext> = (context: IContext) => number;

export type TCurrentState<U extends TDefaultStates, V> = {
    value: U[number];
    history: U[number];
    context: V,
    matches: (expectedVal: U[number]) => boolean
}