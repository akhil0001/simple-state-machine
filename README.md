# simple-state-machine

- Simple State Machine, as the name is self explanatory, is a typescript library that aims to make coding state machines simple, type-safe and fun. 
- If you are new to state machines, I would recommend to go through [statecharts.dev](https://statecharts.dev/what-is-a-state-machine.html). Its an amazing design pattern that helps developer to think about UI State problems with a new mental model. 


## Why?

- This library started as an exploratory project to create my own version of [Xstate](https://xstate.js.org/docs/), which I adore a lot, but also wanted to overcome some inconveniences that I had with it
- One of those inconveniences is writing & maintaining state logic in json format. It always felt slightly tedious and mentioning the actions and services as strings in xstate felt bit out of place.
- The way I look at the state machines is that each state explains the developer about its behaviour and what would happen when it gets a specific event. For example a button that fetches on click could be described as follows 
  ```
  // states
  button stays in 2 states -> idle and loading
  
  // transitions
  when in idle state, on click, button moves to loading state
  when in loading state, invoke a fetch call. 
  when done, move to the idle state and store the response
  ```
- The idea is that what if the state machine code looks exactly same like the above description. This library attempts to do that. StateMachine code with this library looks like this
   ```js
   const states = createStates('idle', 'loading');
   const events = createEvents('CLICK')
   const context = createContext({response: null}) 

   const fetchingMachine = new MachineConfig(states, context, events);
   const {idle, loading} = fetchingMachine.getStates()

   idle
      .on('CLICK')
      .moveTo('loading');
   
   loading
      .invokeAsyncCallback(() => fetch('https://jsonplaceholder.typicode.com/todos/'))
      .onDone()
      .moveTo('idle')
      .updateContext(assign({response: (_, event) => event.data}))

   ```
- This library supports type safety and type intellisense makes writing state machine much easier than in the json format. So most of "API surface area" problem is solved by type sense supported by almost all editors.


## TODO (documentation)

- [ ] Need examples in javascript (Codesandbox)
- [ ] Need examples in typescript (Codesandbox)
- [ ] Need examples in react (Codesandbox)