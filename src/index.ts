import { MachineConfig } from "./machine/MachineConfig";
import { createMachine } from "./machine/createMachine";

interface ITimerContext {
    currentTime: number
}
type TStates = Array<'idle' | 'running' | 'decideWhereToGo'>;
const states: TStates = ['idle', 'running', 'decideWhereToGo']

// actions
const decrementTime = (context: ITimerContext) => {
    return { ...context, currentTime: context.currentTime - 1 }
}

const resetTime = (context: ITimerContext) => {
    return { ...context, currentTime: 0 }
}


// machine config
const timerMachineConfig = new MachineConfig<ITimerContext, TStates>({
    currentTime: 5
});

const { idle, running } = timerMachineConfig.addStates(states);

idle.on('start')
    .moveTo('running')
idle.on('stop')
    .updateContext(resetTime)

running.on('stop')
    .moveTo('idle')
    .updateContext(context => ({ ...context, currentTime: 60 }));

running.on('pause')
    .moveTo('idle')

running.after(1000)
    .moveTo('decideWhereToGo')
    .updateContext(decrementTime)


// decideWhereToGo.onEnter().
// deciderWhereToGo.if(currentTime is greater than 0).alwaysMoveTo('running')
// running.on('stop').if(currentTime is even number).updateContext(...)
// running.on('stop').if(currentTime is odd number).updateContext(...)


// UI Logic

function init() {
    const startBtn = document.getElementById('start');
    const pauseBtn = document.getElementById('pause');
    const stopBtn = document.getElementById('stop');
    const displayTimeEl = document.getElementById('displayTime')

    // init Machine
    const { start, subscribe, send } = createMachine(timerMachineConfig);
    subscribe((state) => {
        const { currentTime } = state.context;
        if (displayTimeEl) {
            displayTimeEl.innerText = '' + currentTime;
        }
        if (state.value === 'idle') {
            startBtn?.removeAttribute('disabled')
            pauseBtn?.setAttribute('disabled', 'true')
            stopBtn?.setAttribute('disabled', 'true')
        }
        else if (state.value === 'running') {
            startBtn?.setAttribute('disabled', 'true')
            pauseBtn?.removeAttribute('disabled')
            stopBtn?.removeAttribute('disabled')
        }
    });
    subscribe(state => console.log(state.value))
    start()

    startBtn?.addEventListener('click', () => send('start'))
    pauseBtn?.addEventListener('click', () => send('pause'))
    stopBtn?.addEventListener('click', () => send('stop'))
}

window.addEventListener('load', init);