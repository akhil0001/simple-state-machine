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

export type TStateEvent<IContext> = {
    type: 'fireAndForget'
    callback: ({ context, event }: { context: IContext, event: TDefaultEvent }) => void
} | {
    type: 'updateContext',
    callback: ({ context, event }: { context: IContext, event: TDefaultEvent }) => IContext
}
export type TSendBack = (actionType: string) => void

export type TCallback<IContext> = (context: IContext, sendBack: TSendBack) => () => void;
