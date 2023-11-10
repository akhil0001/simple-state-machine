import { useCallback, useEffect, useRef } from "react"
import { timerMachineConfig } from ".."
import { useMachine } from "../hooks"

export const TimerContainer = ({ initialTime }: { initialTime: number }) => {
    const { state, send } = useMachine(timerMachineConfig, {
        currentTime: initialTime
    })
    const ref = useRef(null)
    const time = state.context.currentTime;
    const updateTimerInput = useCallback(() => send({ type: 'updateTimerInputEl', data: { timerInputEl: ref.current! } }), [ref, send])
    const start = () => send('start');
    const stop = () => send('stop');
    const pause = () => send('pause');
    useEffect(() => {
        updateTimerInput()
    }, [updateTimerInput])
    return (
        <div style={{ display: "flex", flexFlow: 'column' }}>
            <div>Time: {time}</div>
            <div style={{ display: "flex" }}>
                <input type="number" ref={ref} />
                <button disabled={state.value === 'running'} onClick={start}>Start</button>
                <button disabled={state.value === 'ready'} onClick={pause}>Pause</button>
                <button disabled={state.value === 'ready'} onClick={stop}>Stop</button>
            </div>
        </div>
    )
}