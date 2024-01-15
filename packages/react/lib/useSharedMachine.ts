import { IDefaultEvent, MachineConfig, TReturnState, TDefaultContext, TDefaultStates, interpret } from "@simple-state-machine/core";
import { useCallback, useEffect, useMemo, useState } from "react";

function SharedMachineStore() {
    const store = new Map();
    function getMachineInstance<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>): ReturnType<typeof interpret<U, V, W>> {
        const { id } = machineConfig.getConfig();
        if (store.has(id)) {
            return store.get(id)
        }
        const machineInstance = interpret(machineConfig);
        machineInstance.start();
        store.set(id, machineInstance)
        return machineInstance
    }
    return { getMachineInstance }
}

const sharedStore = SharedMachineStore()

export function useSharedMachine<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>) {
    const { state: initialState, send, subscribe } = useMemo(() => {
        return sharedStore.getMachineInstance(machineConfig)
    }, [machineConfig]);

    const [state, setState] = useState(initialState);
    const subscribeCallback = useCallback((newState: TReturnState<U, V>) => {
        setState({
            value: newState.value,
            context: newState.context,
            matchesAny: newState.matchesAny
        })
    }, []);
    useEffect(() => {
        const unsubscribe = subscribe(subscribeCallback)
        return () => {
            unsubscribe()
        }
    }, [subscribe, subscribeCallback])
    return { state, send }
}