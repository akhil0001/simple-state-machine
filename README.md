# simple-state-machine

- Simple State Machine, as the name is self explanatory, is a typescript library that aims to make coding state machines simple, type-safe and fun. 
- If you are new to state machines, I would recommend to go through [statecharts.dev](https://statecharts.dev/what-is-a-state-machine.html). Its an amazing design pattern that helps developer to think about UI State problems with a new mental model. 

## Installation

## Quick galnce
- A simplest state machine can be a "Light<>Dark" Mode toggling. On click of button is toggle from light to dark or dark to light mode.
- State diagram looks something like this for it: ![toggle-sm](./docs/assets/toggle-sm.png)
- Now code for this using this library like this
   ```js
      import {createState, createEvents, createContext, MachineConfig} from 'simple-state-machine'

      const states = createStates('light', 'dark');
      const events = createEvents('TOGGLE');
      const context = createContext({});

      const ViewMachine = new MachineConfig(states, context, events);
      const {light, dark} = ViewMachine.getStates();
      
      light.on('TOGGLE').moveTo('dark');
      dark.on('TOGGLE').moveTo('light')
   ```

## Examples


## Why, How and What of the Implementation

- For anyone curious to understand these points 
  - [Why ?](./docs/why.md)


## TODO (documentation)

- [ ] Need examples in javascript (Codesandbox)
- [ ] Need examples in typescript (Codesandbox)
- [ ] Need examples in react (Codesandbox)
- [ ] Write a how doc and tag it in 3 questions (docs)