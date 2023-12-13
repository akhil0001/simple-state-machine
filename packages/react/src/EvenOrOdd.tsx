import React from "react";
import { useSharedMachine } from "../lib/useMachine"
import { counterMachine } from "./machines/counterMachine"

export const EvenOrOdd = () => {
    const {state} = useSharedMachine(counterMachine);
    return (
        <p style={{ color: state.value === 'even' ? 'green' : 'red' }}>
            count is {state.context.count}
        </p>
    )
}