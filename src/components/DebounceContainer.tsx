import { useMachine } from "../hooks"
import { debouncingMachine } from "../machine/debounceMachine"
import { MermaidInspect } from "./Mermaid"

export const DebounceContainer = () => {
    const { state, send, mermaidInspect } = useMachine(debouncingMachine, {
        url: 'https://jsonplaceholder.typicode.com/todos/',
        delay: 1000
    })

    const mermaidStr = mermaidInspect();

    return (
        <div>
            <h1>Debounce Machine</h1>
            <input type="text" onChange={(e) => send({
                type: 'updateTodoValue',
                data: {
                    todoValue: e.currentTarget.value
                }
            })} value={state.context.todoValue} />
            <p>State:: {state.value}</p>
            {state.context.data && <p>Response: {state.context.data?.userId}::{state.context.data?.title}</p>}
            <MermaidInspect mermaidStr={mermaidStr} />
        </div>
    )
}