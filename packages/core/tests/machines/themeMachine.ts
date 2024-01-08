import { MachineConfig, createContext, createEvents, createStates } from "../../lib";

const states = createStates('light', 'dark');
const events = createEvents('TOGGLE')
const context = createContext({
    switches: 0
})

export const makeThemeMachine = (onEnterSpy, onExitSpy) => {
    const ThemeMachine = new MachineConfig(states, context, events);

    const whenIn = ThemeMachine.whenIn;

    whenIn('dark').on('TOGGLE').moveTo('light')

    whenIn('light').on('TOGGLE').moveTo('dark')

    whenIn('light').onEnter().fireAndForget(onEnterSpy)
    whenIn('light').onExit().fireAndForget(onExitSpy)

    ThemeMachine.on('TOGGLE').updateContext({
        switches: context => context.switches + 1
    })

    return ThemeMachine;
}