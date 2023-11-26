import { IDefaultEvent, MachineConfig, TCurrentState, TDefaultContext, TDefaultStates, createMachine } from "@simple-state-machine/core";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useMachine<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>, context: Partial<V> = {} as V, debug: boolean = false) {
    const { state: initialState, send, subscribe, start, mermaidInspect } = useMemo(() => {
        return createMachine(machineConfig, context, debug);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [machineConfig])
    const [state, setState] = useState(initialState);
    console.log(state.context)
    const subscribeToAllChangesCb = useCallback((newState: TCurrentState<U, V>) => {
        console.log(newState.context)
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
        const unsubscribe = subscribe('stateChange', subscribeToAllChangesCb);
        return () => {
            unsubscribe()
        }
    }, [subscribe, subscribeToAllChangesCb])

    return { state, send, mermaidInspect };
}