import { TDefaultContext } from "./types";

// this is to support type safety and convert the states as readonly strings
export const createStates = <TStates extends readonly string[]>(...states: TStates) => states;
export const createEvents = <TEvents extends readonly string[]>(...events: TEvents) => events;
export const createContext = <IContext extends TDefaultContext>(context: IContext) => ({ ...context })

export function deepEqual<U extends TDefaultContext, V extends TDefaultContext>(actualObj: U | V, expectedObj: V | U) {
  if (actualObj === expectedObj) {
    return true;
  }

  if (typeof actualObj !== "object" || typeof expectedObj !== "object") {
    return false;
  }

  const actualObjKey = Object.keys(actualObj);
  const expectedObjKey = Object.keys(expectedObj);

  if (actualObjKey.length !== expectedObjKey.length) {
    return false;
  }

  for (let key of actualObjKey) {
    if (!expectedObj.hasOwnProperty(key)) {
      return false;
    }

    const val1 = actualObj[key];
    const val2 = expectedObj[key];

    if (val1 !== val2) {
      return false;
    }

    if (!deepEqual(val1, val2)) {
      return false;
    }
  }

  return true;
}