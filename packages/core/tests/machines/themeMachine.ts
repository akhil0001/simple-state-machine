import { MachineConfig, createContext, createEvents, createStates } from "../../lib";

const states = createStates('light', 'dark', 'repairing', 'testAlways');
const events = createEvents('TOGGLE', 'REPAIR', 'UPDATE_DELAY', 'TEST_ALWAYS')
const context = createContext({
    switches: 0,
    delay: 1000
})

export const makeThemeMachine = (onEnterSpy, onExitSpy, afterTimeoutFireSpy, alwaysFireAndForget) => {
    const ThemeMachine = new MachineConfig(states, context, events);

    const whenIn = ThemeMachine.whenIn;

    whenIn('dark').on('TOGGLE').moveTo('light')

    whenIn('light').on('TOGGLE').if(context => context.switches > 5).moveTo('dark')
    whenIn('light').on('TOGGLE').if(context => context.switches >= 2).moveTo('light')
    whenIn('light').on('TOGGLE').moveTo('dark')
    whenIn('light').onEnter().fireAndForget(onEnterSpy)
    whenIn('light').onExit().fireAndForget(onExitSpy)
    whenIn('light').on('REPAIR').moveTo('repairing');
    whenIn('repairing').after(5000).moveTo('light').fireAndForget(afterTimeoutFireSpy)
    whenIn('dark').after(context => context.delay).moveTo('repairing');
    whenIn('repairing').on('TOGGLE').moveTo('dark')
    
    whenIn('testAlways').always().moveTo('dark').fireAndForget(alwaysFireAndForget)
    
    ThemeMachine.on('TOGGLE').updateContext({
        switches: context => context.switches + 1
    })
    ThemeMachine.on('UPDATE_DELAY').updateContext({
        delay: (_, event) => event.data.delay
    })
    ThemeMachine.on('TEST_ALWAYS').moveTo('testAlways')
    return ThemeMachine;
}