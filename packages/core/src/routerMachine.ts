import { MachineConfig, createContext, createEvents, createStates } from "../lib";

const context = createContext({
    pathname: '',
})

const states = createStates('idle')

const events = createEvents('PUSH', 'UPDATE_PATH_NAME')

export const RouterMachine = new MachineConfig(states, context, events);

const { idle } = RouterMachine.getStates();

idle.invokeCallback((_, callback) => {
    const updatePathName = () => {
        const pathname = window.location.pathname;
        callback({
            type: 'UPDATE_PATH_NAME',
            data: {
                pathname: pathname
            }
        });
    }
    window.addEventListener('load', updatePathName);
    window.addEventListener('popstate', updatePathName);
    return () => {
        window.removeEventListener('load', updatePathName);
        window.removeEventListener('popstate', updatePathName);
    }
}).on('UPDATE_PATH_NAME').updateContext({
    pathname: (_, event) => event.data.pathname as string
})

idle.on('PUSH').fireAndForget((_, event) => {
    history.pushState({}, '', event.data.to as string);
    window.dispatchEvent(new Event('popstate'))
})