import { interpret } from '../lib'
import { counterMachine } from './counterMachine'
import { debounceMachine } from './debounceMachine'
function counter() {
    const counterEl = document.createElement('p')
    const incrementBtn = document.createElement('button')
    incrementBtn.innerText = "increment"
    const app = document.getElementById('app')

    const { start, send, subscribe } = interpret(counterMachine);
    subscribe(newState => {
        counterEl.innerText = newState.context.count + ' State:' + newState.value
    })
    incrementBtn.onclick = () => send('increment');

    if(app){
        app.appendChild(counterEl)
        app.appendChild(incrementBtn)
    }

    start()
}
function init() {
    const inputEl = document.getElementById('todoNumber')
    const responseEl = document.getElementById('response')
    const statusEl = document.getElementById('status')
    const { start, send, subscribe } = interpret(debounceMachine)
    inputEl?.addEventListener('input', (e) => {
        const target = e.currentTarget as HTMLInputElement;
        send('updateTodoValue', { todoValue: target.value })
    });
    subscribe(state => {
        console.log('------ I am now in ', state.value, ' ------')
        if (statusEl) {
            statusEl.innerHTML = "Current State of Machine : <i>" + state.value + '</i>'
        }
    });
    subscribe((state) => {
        if (responseEl && state.context.data) {
            responseEl.innerText = 'Response::' + state.context.data.title
        }
    })
    start()
    counter()
}

window.onload = init