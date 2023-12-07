import { MachineConfig, createContext, createEvents, createStates } from "../lib";

const context = createContext({
    pathname: '',
})

const states = createStates('loading', 'ready')

const events = createEvents('PUSH', 'UPDATE_PATH_NAME', 'LOADED')

export const RouterMachine = new MachineConfig(states, context, events);

const { loading, ready } = RouterMachine.getStates();

// RouterMachine.on('UPDATE_PATH_NAME').updateContext({
//     pathname: (_, event) => event.data.pathname as string
// })

const {on} = loading.invokeCallback((_, callback) => {
    const updatePathName = () => {
        const pathname = window.location.pathname;
        console.log('pathname', pathname)
        callback({
            type: 'UPDATE_PATH_NAME',
            data: {
                pathname: pathname
            }
        })
    }
    const emitLoaded = () => {
        console.log('called emit loaded')
        callback('LOADED');
    }
    window.addEventListener('DOMContentLoaded', updatePathName);
    window.addEventListener('load', emitLoaded);
    return () => {
        window.removeEventListener('DOMContentLoaded', updatePathName);
        window.removeEventListener('load', emitLoaded);
    }
});

on('UPDATE_PATH_NAME').updateContext({pathname: (_, event) => event.data.pathname as string});
on('LOADED').moveTo('ready')

ready.invokeCallback((_, callback) => {
    const updatePathName = () => {
        const pathname = window.location.pathname;
        console.log(pathname, 'inside popstate')
        callback({
            type: 'UPDATE_PATH_NAME',
            data: {
                pathname: pathname
            }
        });
    }
    window.addEventListener('popstate', updatePathName);
    return () => {
        window.removeEventListener('popstate', updatePathName);
    }
})

ready.on('PUSH').fireAndForget((_, event) => {
    history.pushState({}, '', event.data.to as string);
    window.dispatchEvent(new Event('popstate'))
})