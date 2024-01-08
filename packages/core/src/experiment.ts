import { MachineConfig, createContext, createStates } from "../lib";

import { createEvents } from "../lib/MachineConfig";
import { interpret } from "../lib/interpret/interpret";

const states = createStates('light', 'dark', 'repairing')
const events = createEvents('INC', 'DEC', 'TOGGLE', 'REPAIR')
const context = createContext({
    count: 0,
    switches: 0,
    darkSwitches: 0,
    lightSwitches: 0
})

const testMachine = new MachineConfig(states,context,events)

testMachine.on('INC').updateContext({
    count: (context) => context.count + 1
})


testMachine.on('DEC').updateContext({
    count: (context) => context.count - 1
})

const {whenIn} = testMachine;

whenIn('dark').on('TOGGLE').moveTo('light').updateContext({
    lightSwitches: context => context.lightSwitches + 1
})

whenIn('light').on('TOGGLE').if(context => context.switches >= 2).moveTo('light').updateContext({
    darkSwitches: context => context.darkSwitches + 1
})

whenIn('light').on('TOGGLE').moveTo('dark').updateContext({
    darkSwitches: context => context.darkSwitches + 1
})

whenIn('light').on('REPAIR').moveTo('repairing')
whenIn('repairing').after(5000).moveTo('light')
whenIn('repairing').always().moveTo('dark')


// testMachine.on('TOGGLE').updateContext({
//     switches: context => context.switches + 1
// })

function init() {
    const app = document.getElementById('app');
    const incButton = document.createElement('button')
    incButton.innerText = "INC";
    const toggleBtn = document.createElement('button')
    toggleBtn.innerText = "TOGGLE";
    const decButton = document.createElement('button')
    decButton.innerText = "DEC";
    const repairBtn = document.createElement('button')
    repairBtn.innerText = "REPAIR";
    const counter = document.createElement('p')
    
    const {start, send, subscribe} = interpret(testMachine);
    const inc = () => send('INC')
    const dec = () => send('DEC');
    const toggle = () => send('TOGGLE')
    incButton.onclick = inc;
    decButton.onclick = dec;
    toggleBtn.onclick = toggle
    repairBtn.onclick = () => send('REPAIR');
    app?.appendChild(counter)
    // app?.appendChild(incButton)
    // app?.appendChild(decButton)
    app?.appendChild(toggleBtn)
    app?.appendChild(repairBtn)
    subscribe((state) => {
        console.log(state.value, 'in subscriber')
        // counter.innerText = state.context.count + '-' + state.value+'-switches::'+state.context.switches+'-lightSwitches::'+state.context.lightSwitches+'-darkSwitches::'+state.context.darkSwitches
        counter.innerText =  state.value+'-switches::'+state.context.switches
    })
    start();
}

window.onload = init