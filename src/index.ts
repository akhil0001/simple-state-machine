import { MachineConfig } from "./machine/MachineConfig";
import { createMachine } from "./machine/createMachine";

// machine config
const timerMachineConfig = new MachineConfig({
    currentTime: 60
});

const { idle, running } = timerMachineConfig.addStates(['idle', 'running']);


idle.on('start').moveTo('running')
idle.on('stop').updateContext(({ context }) => ({ ...context, currentTime: 0 }))
running.on('stop').moveTo('idle').updateContext(({ context }) => ({ ...context, currentTime: 60 }));
running.on('pause').moveTo('idle')
running.after(1000).moveTo('running').updateContext(({ context }) => ({ ...context, currentTime: context.currentTime - 1 }))

function init() {
    const startBtn = document.getElementById('start');
    const pauseBtn = document.getElementById('pause');
    const stopBtn = document.getElementById('stop');
    const displayTimeEl = document.getElementById('displayTime')

    // init Machine
    const { start, subscribe, send } = createMachine(timerMachineConfig);

    subscribe((state) => {
        // const running = state.value === 'running';
        const { currentTime } = state.context;
        // startBtn?.setAttribute('disabled', '' + !running)
        // pauseBtn?.toggleAttribute('disabled', '' + running)
        // stopBtn?.setAttribute('disabled', '' + running)
        if (displayTimeEl) {
            displayTimeEl.innerText = '' + currentTime;
        }

    });
    start()

    startBtn?.addEventListener('click', () => send('start'))
    pauseBtn?.addEventListener('click', () => send('pause'))
    stopBtn?.addEventListener('click', () => send('stop'))
}

window.addEventListener('load', init);