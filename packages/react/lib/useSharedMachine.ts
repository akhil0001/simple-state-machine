import { IDefaultEvent, MachineConfig, TCurrentState, TDefaultContext, TDefaultStates, createMachine } from "@simple-state-machine/core";
import { useCallback, useEffect, useMemo, useState } from "react";

function SharedMachineStore() {
    const store = new Map();
    function getMachineInstance<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>): ReturnType<typeof createMachine<U,V,W>>{
        const {id} = machineConfig.getConfig();
        if(store.has(id)){
            return store.get(id)
        }
        const machineInstance = createMachine(machineConfig);
        machineInstance.start();
        store.set(id, machineInstance)
        return machineInstance
    }
    return {getMachineInstance}
}

const sharedStore = SharedMachineStore()

export function useSharedMachine<U extends TDefaultStates, V extends TDefaultContext, W extends IDefaultEvent>(machineConfig: MachineConfig<U, V, W>) {
    const {state: initialState, send, subscribe} = useMemo(() => {
        return sharedStore.getMachineInstance(machineConfig)
    },[machineConfig]);

    const [state, setState] = useState(initialState);
    const subscribeToAllChangesCb = useCallback((newState: TCurrentState<U,V>) => {
        setState({
            value: newState.value,
            context: newState.context,
            history: newState.history
        })
    },[]);
    useEffect(() => {
        const unsubscribe = subscribe('allChanges', subscribeToAllChangesCb)
        return () => {
            unsubscribe()
        }
    },[subscribe, subscribeToAllChangesCb])
    return {state, send}
}