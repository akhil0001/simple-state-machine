import { ChangeEvent, useCallback } from "react";
import { useMachine } from "../../lib"
import { debounceMachine } from "../machines/debounceMachine"

export const Debounce = () => {
    const { state, send } = useMachine(debounceMachine);
    const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        send({
            type: 'updateInput', data: {
                input: e.currentTarget.value
            }
        })
    }, [send])

    return (
        <div style={{ display: 'flex', flexFlow: "column" }}>
            <input type="number" onChange={onChange} value={state.context.input} />
            <p>State: {state.value}</p>
        </div>
    )
}