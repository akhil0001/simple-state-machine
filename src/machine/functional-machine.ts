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

// TODO: There should be a best practice to separate out the actions, services and transitions
idle.on('fetch')
    .moveTo('fetching')
    .fireAndForget(({ context }) => context.id)
    .fireAndForget(() => console.log('2'))
    .updateContext(() => {
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
})
    .on('done')
    .moveTo('idle')
fetching.on('error')
    .moveTo('error')

error.invokeCallback(clickEventCb)
    .on('clicked')
    .fireAndForget(({ event }) => console.log(event.type, 'from ff'))
error.after(5000)
    .moveTo('idle')
    .fireAndForget(() => console.log('moved to idle'));
error.on('refetch')
    .moveTo('fetching')

/* Usage of Machine */

import { createMachine } from "./createMachine";
import { TCallback } from "./types";

const { send, subscribe, start } = createMachine<SomeContext>(machineConfig);
subscribe((state) => console.log(state.value, 'from subscription'))
start();
send('fetch')
send('error')
