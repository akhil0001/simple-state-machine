/* Creation of Machine */
import { MachineConfig } from "./MachineConfig";
interface SomeContext {
    id: number
}
const machineConfig = new MachineConfig<SomeContext>({
    id: 0
});

const { idle, fetching, error } = machineConfig.addStates(['idle', 'fetching', 'error']);
machineConfig.initialState = (idle);

idle.on('fetch').moveTo('fetching').fireAndForget(({ context }) => context.id).fireAndForget(() => console.log('2')).updateContext(() => {
    return ({
        id: 4
    })
});

const clickEventCb: TCallback<SomeContext> = (context, sendBack) => {
    const clickListener = () => {
        console.log(context.id, 'clicked');
        sendBack('clicked')
    }
    window.addEventListener('click', clickListener);
    return () => {
        window.removeEventListener('click', clickListener)
    }
}
fetching.invokeCallback((context, sendBack) => {
    const id = setTimeout(() => {
        console.log(context.id, 'from timeout');
        sendBack('done')
    }, 1000)
    return () => {
        clearTimeout(id)
    }
}).on('done').moveTo('idle')
fetching.on('error').moveTo('error')
error.invokeCallback(clickEventCb).on('clicked').fireAndForget(({ event }) => console.log(event.type, 'from ff'))
/* Usage of Machine */

import { createMachine } from "./createMachine";
import { TCallback } from "./types";

const [state, send] = createMachine<SomeContext>(machineConfig);
console.log(state.value, state.context.id)
send('fetch')
send('error')
console.log(state.value, state.context.id)
