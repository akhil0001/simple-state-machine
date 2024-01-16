import { IDefaultEvent, MachineConfig, TReturnState, TDefaultContext, TDefaultStates, interpret } from "@simple-state-machine/core";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useMachine<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>, context: Partial<V> = {} as V) {
    const { state: initialState, send, subscribe, start } = useMemo(() => {
        return interpret(machineConfig, context);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [machineConfig])
    const [state, setState] = useState(initialState);
    const subscribeCallback = useCallback((newState: TReturnState<U, V>) => {
        setState({
            value: newState.value,
            context: newState.context,
            matchesAny: newState.matchesAny
        });
    }, []);


    useEffect(() => {
        const unsubscribe = subscribe(subscribeCallback);
        return () => {
            unsubscribe()
        }
    }, [subscribe, subscribeCallback])

    useEffect(() => {
        start()
    }, [start])

    return { state, send };
}