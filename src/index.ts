import { MachineConfig } from "./machine/MachineConfig";
import { createMachine } from "./machine/createMachine";
import { IDefaultEvent, TUpdateContextEventCallback } from "./machine/types";

interface ITimerContext {
    currentTime: number,
    limit: number,
    timerInputEl: HTMLElement | null
}
type TStates = Array<'idle' | 'running' | 'decideWhereToGo' | 'ready'>;
const states: TStates = ['idle', 'running', 'decideWhereToGo', 'ready']
interface ITimerEvents extends IDefaultEvent {
    type: 'start' | 'stop' | 'pause' | 'timeChange' | 'updateTimerInputEl',
    data?: {
        time?: number,
        timerInputEl?: HTMLElement
    }
}
// actions
const decrementTime: TUpdateContextEventCallback<ITimerContext, ITimerEvents> = (context) => {
    return { ...context, currentTime: context.currentTime - 1 }
}

const resetTime = (context: ITimerContext) => {
    return { ...context, currentTime: 5 }
}


const setTime = (context: ITimerContext, event: ITimerEvents) => ({ ...context, currentTime: event.data?.time ?? context.currentTime, });

// conds
const isTimeZero = (context: ITimerContext) => context.currentTime === 0;

// machine config
export const timerMachineConfig = new MachineConfig<ITimerContext, TStates, ITimerEvents>({
    currentTime: 5,
    limit: 0,
    timerInputEl: null
});

const { idle, running, decideWhereToGo, ready } = timerMachineConfig.addStates(states);

idle.on('updateTimerInputEl')
    .moveTo('ready')
    .updateContext((context, event) => ({ ...context, timerInputEl: event.data?.timerInputEl ?? context.timerInputEl }))


ready.invokeCallback((context, sendBack) => {
    const { timerInputEl } = context;
    const inputEvtListener = (e: HTMLElementEventMap['input']) => {
        const target = e.target as HTMLInputElement;
        sendBack({
            type: 'timeChange',
            data: {
                time: Number(target.value ?? 0)
            }
        })
    }
    timerInputEl?.addEventListener('input', inputEvtListener)
    return () => {
        console.log('removed event listener')
        timerInputEl?.removeEventListener('input', inputEvtListener)
    }
})

ready.on('start')
    .moveTo('running')
    .fireAndForget(context => {
        const inputEl = context.timerInputEl as HTMLInputElement;
        inputEl.value = '';
    })

ready.on('timeChange')
    .updateContext(setTime)

running.after(1000)
    .moveTo('decideWhereToGo')
    .updateContext(decrementTime)

running.on('stop')
    .moveTo('ready')
    .updateContext(resetTime)

running.on('pause')
    .moveTo('ready')

decideWhereToGo.always()
    .if(isTimeZero)
    .moveTo('ready')
    .updateContext(resetTime)

decideWhereToGo.always()
    .moveTo('running')

// UI Logic
export const { start, subscribe, send, inspect } = createMachine(timerMachineConfig);

function init() {
    const startBtn = document.getElementById('start');
    const pauseBtn = document.getElementById('pause');
    const stopBtn = document.getElementById('stop');
    const displayTimeEl = document.getElementById('displayTime')
    const timerInput = document.getElementById('timerInput');

    // init Machine



    subscribe('allChanges', (state) => {
        const { currentTime } = state.context;
        if (displayTimeEl) {
            displayTimeEl.innerText = '' + currentTime;
        }
        if (state.value === 'idle') {
            startBtn?.setAttribute('disabled', 'true')
        }
        if (state.value === 'ready') {
            startBtn?.removeAttribute('disabled')
            pauseBtn?.setAttribute('disabled', 'true')
            stopBtn?.setAttribute('disabled', 'true')
            timerInput?.removeAttribute('disabled')
        }
        else if (state.value === 'running') {
            startBtn?.setAttribute('disabled', 'true')
            timerInput?.setAttribute('disabled', 'true')
            pauseBtn?.removeAttribute('disabled')
            stopBtn?.removeAttribute('disabled')
        }
    });
    start()
    send({
        type: 'updateTimerInputEl',
        data: {
            timerInputEl: timerInput!
        }
    })

    startBtn?.addEventListener('click', () => send('start'))
    pauseBtn?.addEventListener('click', () => send('pause'))
    stopBtn?.addEventListener('click', () => send('stop'))
}

window.addEventListener('load', init);