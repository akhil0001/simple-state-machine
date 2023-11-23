import { IDefaultEvent, TAssignPayload, TDefaultContext, TEventPayload } from "./types";

export function assign<IContext extends TDefaultContext, IEvents extends IDefaultEvent>(payload: TAssignPayload<IContext, IEvents>): (context: IContext, event: TEventPayload<IEvents>) => IContext {
    return function (context: IContext, event: TEventPayload<IEvents>) {
        let initialContext = context;
        for (const key in payload) {
            const cb = payload[key]
            const newContextVal = cb!(context, event);
            initialContext = { ...initialContext, [key]: newContextVal }
        }
        return { ...initialContext }
    }
}
