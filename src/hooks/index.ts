import { useCallback, useEffect, useMemo, useState } from "react";
import { MachineConfig } from "../machine/MachineConfig";
import { TCurrentState, createMachine } from "../machine/createMachine";
import { IDefaultEvent, TDefaultContext, TDefaultStates } from "../machine/types";

export function useMachine<U extends TDefaultContext, V extends TDefaultStates, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>) {
    const { state: initialState, send, subscribe, start } = useMemo(() => {
        return createMachine(machineConfig);
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
        subscribe('allChanges', subscribeToAllChangesCb)
    }, [subscribe, subscribeToAllChangesCb])

    return { state, send };
}