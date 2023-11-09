import { dragAroundMachineConfig } from "../drag-and-drop"
import { useMachine } from "../hooks"

export const Rectangle = () => {
    const { state, send } = useMachine(dragAroundMachineConfig)
    return (
        <div style={{ position: 'absolute', width: '200px', height: '200px', backgroundColor: state.value === 'idle' ? 'aquamarine' : 'blue' }} onMouseDown={() => send('mouseDown')} onMouseUp={() => {
            send('mouseUp')
        }} onMouseLeave={() => send('mouseUp')}>

        </div>
    )
}