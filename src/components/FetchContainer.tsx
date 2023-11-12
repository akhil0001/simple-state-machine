import { useEffect } from "react";
import { useMachine } from "../hooks"
import { fetchingMachineConfig } from "../machine/fetchingMachine"

export const FetchContainer = () => {
    const { state, send } = useMachine(fetchingMachineConfig);
    useEffect(() => {
        send({
            type: 'updateUrl',
            data: {
                url: 'https://jsonplaceholder.typicode.com/todos/'
            }
        })
    }, [send])
    const fetch = () => send('fetch');
    return (
        <div>
            <h1>Fetching machine</h1>
            <input type="number" disabled={state.value === 'fetching'} value={state.context.todoValue} onChange={e => send({
                type: 'updateTodoValue',
                data: {
                    todoValue: e.currentTarget.value
                }
            })} />
            <button onClick={fetch} disabled={state.value === 'fetching'}>{state.value === 'fetching' ? 'Fetching' : 'Fetch'}</button>
            <p>State:: {state.value}</p>
            {state.context.data && <p>{state.context.data.title}</p>}
        </div>
    )
}