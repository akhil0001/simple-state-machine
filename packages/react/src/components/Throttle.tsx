import React from "react"
import { useMachine } from "../../lib"
import { throttleMachine } from "../machines/throttleMachine"

export const Throttle = () => {
    const { state, send } = useMachine(throttleMachine)
    return (
        <div style={{ display: "flex", flexFlow: "column" }}>
            <h1>Throttle</h1>
            <button onClick={() => send('fetch')}>Fetch</button>
            <p>State: {state.value}</p>
        </div>
    )
}