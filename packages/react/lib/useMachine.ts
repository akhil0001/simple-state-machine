import { IDefaultEvent, MachineConfig, TCurrentState, TDefaultContext, TDefaultStates, createMachine } from "@simple-state-machine/core";
import { } from '@simple-state-machine/core'
import { useCallback, useEffect, useMemo, useState } from "react";

export function useMachine<U extends TDefaultContext, V extends TDefaultStates, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>, context: Partial<U> = {} as U) {
    const { state: initialState, send, subscribe, start, mermaidInspect } = useMemo(() => {
        return createMachine(machineConfig, context);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    return { state, send, mermaidInspect };
}