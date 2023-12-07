import { createMachine } from '../lib'
import { debounceMachine } from './debounceMachine'
import { RouterMachine } from './routerMachine'
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
            statusEl.innerHTML = "Current State of Machine : <i>" + state.value + '</i>'
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

const {start, send, subscribe} = createMachine(RouterMachine);
subscribe('allChanges', (state, actionType) => console.log(state.context.pathname, 'from cb by ', actionType))
const a = document.createElement('a')
a.addEventListener('click', (e) =>{
    e.preventDefault();
    start()
    send({
        type: 'PUSH',
        data: {
            to: '/home'
        }
    })
})

a.innerText = 'Link'
document.body.appendChild(a)
start();
window.onload = init