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

idle.on('fetch').moveTo('fetching').fireAndForget(({ context }) => context.id).fireAndForget(() => console.log('2'))
fetching.on('poll').fireAndForget(() => console.log('received a poll event'))
fetching.on('success').moveTo('idle');
error.on('fetch').moveTo('idle');

/* Usage of Machine */

import { createMachine } from "./createMachine";

const [state, send] = createMachine<SomeContext>(machineConfig);
console.log(state.value)
send('fetch')
send('poll')
send('success')
console.log(state.value)
