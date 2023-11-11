import { useCallback, useEffect, useMemo, useState } from "react";
import { MachineConfig } from "../machine/MachineConfig";
import { TCurrentState, createMachine } from "../machine/createMachine";
import { IDefaultEvent, TDefaultContext, TDefaultStates } from "../machine/types";

export function useMachine<U extends TDefaultContext, V extends TDefaultStates, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>, context: Partial<U> = {} as U) {
    const { state: initialState, send, subscribe, start } = useMemo(() => {
        return createMachine(machineConfig, context);
    }, [machineConfig])
    const [state, setState] = useState(initialState);

    const subscribeToAllChangesCb = useCallback((newState: TCurrentState<U, V>) => {
        setState({
            value: newState.value,
            context: newState.context,
            history: newState.history
        });
    }, []);


    useEffect(() => {
        start()
    }, [start])

    useEffect(() => {
        const unsubscribe = subscribe('allChanges', subscribeToAllChangesCb);
        return () => {
            unsubscribe()
        }
    }, [subscribe, subscribeToAllChangesCb])

    return { state, send };
}