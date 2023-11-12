import { useMachine } from "../hooks"
import { debouncingMachine } from "../machine/debounceMachine"

export const DebounceContainer = () => {
    const { state, send } = useMachine(debouncingMachine, {
        url: 'https://jsonplaceholder.typicode.com/todos/'
    })

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
        </div>
    )
}