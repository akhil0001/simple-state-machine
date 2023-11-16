import { createMachine } from '../lib'
import { debounceMachine } from './debounceMachine'
function init() {
    // get elements
    const inputEl = document.getElementById('todoNumber')
    const responseEl = document.getElementById('response')
    const statusEl = document.getElementById('status')
    // create machine
    const { start, send, subscribe } = createMachine(debounceMachine, {
        url: 'https://jsonplaceholder.typicode.com/todos/',
        delay: 1000
    })
    inputEl?.addEventListener('input', (e) => {
        const target = e.currentTarget as HTMLInputElement;
        send({
            type: 'updateTodoValue',
            data: {
                todoValue: target.value
            }
        })
    });
    // just state change
    subscribe('stateChange', state => {
        if (statusEl) {
            statusEl.innerText = "Current State of Machine : " + state.value
        }
    });
    // for all changes
    subscribe('allChanges', (state) => {
        if (responseEl && state.context.data) {
            responseEl.innerText = 'Response::' + state.context.data.title
        }
    })
    // start the machine
    start()
}

window.onload = init