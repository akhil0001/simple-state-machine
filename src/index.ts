import { MachineConfig } from "./machine/MachineConfig";
import { createMachine } from "./machine/createMachine";
import { IDefaultEvent, TUpdateContextEventCallback } from "./machine/types";

interface ITimerContext {
    currentTime: number,
    limit: number
}
type TStates = Array<'idle' | 'running' | 'decideWhereToGo'>;
const states: TStates = ['idle', 'running', 'decideWhereToGo']
interface ITimerEvents extends IDefaultEvent {
    type: 'start' | 'stop' | 'pause' | 'timeChange',
    data?: {
        time?: number
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
const timerMachineConfig = new MachineConfig<ITimerContext, TStates, ITimerEvents>({
    currentTime: 5,
    limit: 0
});

const { idle, running, decideWhereToGo } = timerMachineConfig.addStates(states);


idle.on('start')
    .moveTo('running')

idle.on('timeChange')
    .updateContext(setTime)

running.after(1000)
    .moveTo('decideWhereToGo')
    .updateContext(decrementTime)

running.on('stop')
    .moveTo('idle')
    .updateContext(resetTime)

running.on('pause')
    .moveTo('idle')

decideWhereToGo.always()
    .if(isTimeZero)
    .moveTo('idle')
    .updateContext(resetTime)

decideWhereToGo.always()
    .moveTo('running')

// UI Logic

function init() {
    const startBtn = document.getElementById('start');
    const pauseBtn = document.getElementById('pause');
    const stopBtn = document.getElementById('stop');
    const displayTimeEl = document.getElementById('displayTime')
    const timerInput = document.getElementById('timerInput');

    // init Machine
    const { start, subscribe, send } = createMachine(timerMachineConfig);
    subscribe('allChanges', (state) => {
        const { currentTime } = state.context;
        if (displayTimeEl) {
            displayTimeEl.innerText = '' + currentTime;
        }
        if (state.value === 'idle') {
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
    timerInput?.addEventListener('input', (e) => {
        const target = e.currentTarget as HTMLInputElement;
        send({ type: 'timeChange', data: { time: Number(target.value ?? 0) } })
    });

    start()

    startBtn?.addEventListener('click', () => send('start'))
    pauseBtn?.addEventListener('click', () => send('pause'))
    stopBtn?.addEventListener('click', () => send('stop'))
}

window.addEventListener('load', init);