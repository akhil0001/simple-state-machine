import { TDefaultContext } from "./types";

// this is to support type safety and convert the states as readonly strings
export const createStates = <TStates extends readonly string[]>(...states: TStates) => states;
export const createEvents = <TEvents extends readonly string[]>(...events: TEvents) => events;
export const createContext = <IContext extends TDefaultContext>(context: IContext) => ({ ...context })