import { MachineConfig } from "../packages/core/lib/MachineConfig";
import { createMachine } from "../packages/core/lib/createMachine";

interface IDragAroundContext {
    x: number,
    y: number
}

type TStates = Array<'idle' | 'dragging'>

interface IEvents {
    type: 'mouseDown' | 'mouseMove' | 'mouseUp',
    data?: {
        x?: number;
        y?: number
    }
}

const states: TStates = ['idle', 'dragging']

export const dragAroundMachineConfig = new MachineConfig<IDragAroundContext, TStates, IEvents>({
    x: 0,
    y: 0
})

const { idle, dragging } = dragAroundMachineConfig.addStates(states)

idle.on('mouseDown')
    .moveTo('dragging')

dragging.on('mouseMove')
    .updateContext((context, event) => ({
        x: event.data?.x ?? context.x,
        y: event.data?.y ?? context.y
    }))

dragging.on('mouseUp')
    .moveTo('idle')


export const { start, send, subscribe, inspect } = createMachine(dragAroundMachineConfig);
function init() {
    const draggableEl = document.getElementById('draggable');
    const tooltipEl = document.getElementById('positionTooltip')

    draggableEl?.addEventListener('mousedown', () => send('mouseDown'))
    window?.addEventListener('mousemove', (e) => {
        send({
            type: 'mouseMove',
            data: {
                x: e.clientX,
                y: e.clientY
            }
        })
    })
    draggableEl?.addEventListener('mouseup', () => send('mouseUp'))
    start()
    subscribe('stateChange', ({ value }) => {
        if (tooltipEl)
            tooltipEl.style.opacity = '' + Number(value === 'dragging')
        if (draggableEl)
            draggableEl.style.backgroundColor = value === 'idle' ? 'aquamarine' : 'aqua'
    })
    subscribe('contextChange', ({ context }) => {
        if (draggableEl) {
            draggableEl.style.top = context.y - 50 + 'px';
            draggableEl.style.left = context.x - 50 + 'px';
        }
        if (tooltipEl) {
            tooltipEl.innerText = `x: ${context.x}px; y:${context.y}px`
            tooltipEl.style.top = context.y + 60 + 'px';
            tooltipEl.style.left = context.x - 70 + 'px'
        }
    })
}
// window.addEventListener('load', init)