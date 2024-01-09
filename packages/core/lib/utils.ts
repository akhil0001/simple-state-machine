import { TDefaultContext } from "./types";

// this is to support type safety and convert the states as readonly strings
export const createStates = <TStates extends readonly string[]>(...states: TStates) => states;
export const createEvents = <TEvents extends readonly string[]>(...events: TEvents) => events;
export const createContext = <IContext extends TDefaultContext>(context: IContext) => ({ ...context })

export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 === null || obj2 === null || typeof obj1 !== "object" || typeof obj2 !== "object") {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!obj2.hasOwnProperty(key)) {
      return false;
    }

    const value1 = obj1[key];
    const value2 = obj2[key];

    if (!deepEqual(value1, value2)) {
      return false;
    }
  }

  return true;
}