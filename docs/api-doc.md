# API Documentation

### Table of Contents
- [API Documentation](#api-documentation)
    - [Table of Contents](#table-of-contents)
  - [States](#states)
  - [Events](#events)
  - [Context](#context)
  - [Machine Config](#machine-config)
  - [Transitions](#transitions)

## States

- States can be considered as the encapsulation of the behavior of the app at a given point of time. 
- Just like physical objects, the software apps can be in different states based on the conditions surrounding it and actions that take place at that point of time
    - ### createStates()
      - `createStates` function takes in strings and only exists as a function to provide type safety
      - Usage:
          ```js
              const states = createStates('idle', 'loading', 'error');
          ```
      - The resulting `states` is a `readonly string[]` that should be passed as an argument to `MachineConfig`
      - **Library Alert**: The first state passed into the function, in this case `idle`, is considered as the `initial` state

## Events
- Events can be considered as a way of communicating with the state machine. Think of it as a message to the entity that can be used to make a decision on what to do with it
    - ### createEvents()
      - `createEvents` function takes in strings and this exists as a function to provide type safety
      - Usage:
        ```js
            const events = createEvents('LOAD', 'FAILED', 'RESET')
        ```
      - The resulting `events` is a `readonly string[]` that should be passed as an argument to `MachineConfig`
      - **Library Alert**: We use UpperCase strings to denote events. This is more of a convention
        
## Context
- Context can be considered as the data that can be modified based on transitions or events.
- Any data that is related to `transitions` or `events` should be stored inside context
  - ### createContext()
    - `createContext` function takes in an object that can contain any type of the data that is expected to be modified during the course of running of the state machine
    - Usage:
        ```js
            const context = createContext({
                url: '',
                response: null
            })
        ```
    - **Library Alert:** Context is stored as an object

## Machine Config
- Before we get to `transitions`, we need to pass the above lego blocks into this function so that we get the tools and utilities to write transitions and more cool stuff
  - ### MachineConfig
    - MachineConfig is a class which can be used to instantiate a new object. It needs 3 parameters: 
      - `states`
      - `context`
      - `events`
    - Usage:
        ```js
            const FetchingMachine = new MachineConfig(states, context, events);
        ```
    - If you are using typescript and need more fine grained support on the types, you can pass your types like this
        ```ts
            type TStates = ['idle', 'loading', 'error']
            interface IContext {
                url: string;
                response: null | Response
            }
            type TEvents = ['LOAD', 'FAILED', 'RESET']

            const FetchingMachine = new MachineConfig<TStates, IContext, TEvents>(states, context, events);
        ```
    - The instanceof machine config would return wide variety of things that can be used to create `transitions`, `conditions` etc. Will look into them in a moment. 
    - The instance of machine config is the object that encapsulates all the logic of lego blocks and hence will be used for the rest of the app as is
      - ### getStates()
        - getStates is a function that can be used to get the `State` objects that have all the methods to define variety of state functionalities
        - Usage:
            ```js
                const {idle, loading, error} = FetchingMachine.getStates()
            ```
        - **Library Alert**: States returned have the same name as their counterparts that were passed as strings in [`createStates()`](#createstates)

## Transitions
- Transitions define what happens when a state recieves an event. There can be 4 things that can happen when a state receives an event. They are
  - 1. No transition, but update the context using `updateContext` or update an external store using `fireAndForget`
  - 2. Transition to the same state, hence triggering all the lifecycle methods 
  - 3. Transition to new state using `moveTo`
  - 4. Transition to new state using `moveTo` and either update context or update an external store
- A transition can be defined using `on` method
  - ### on()
    - This method takes event as a parameter and returns variety of methods like
      - 1. `moveTo()`
      - 2. `if()`
      - 3. `fireAndForget()`
      - 4. `updateContext()`
    - Usage:
        ```js
            // No transition, but just fire a function say logger or sentry event etc
            idle.on('LOAD').fireAndForget(doSomething)

            // No transition, but update context of state machine
            idle.on('LOAD').updateContext({...})
            
            // transition to same state but re-run all life cycle methods
            idle.on('LOAD').moveTo('idle')
            
            // transition to new state
            idle.on('LOAD').moveTo('loading')
            
            // transition to new state and update context and fire external function
            idle.on('LOAD').moveTo('loading').updateContext({...}).fireAndForget(doSomething)
        ```
  - ### moveTo()
    - This method takes state as parameter that is already defined and returns the following methods
      - 1. `fireAndForget()`
      - 2. `updateContext`
    - Usage:
      ```js
        idle.on('LOAD').moveTo('loading')
        loading.on('FAILED').moveTo('error')
        error.on('RESET').moveTo('idle')
      ```
  - ### if()
    - This method is to define a condition, based on which transition happens.
    - `if` method takes a function as argument, which has to return a boolean. The function passed as an argument would have access to `context`
    - When the condition returns true, only then the transition would be executed
    - Usage:
      ```js
        // only move to loading when the url in the context is not empty
        idle.on('LOAD').if(context => context.url !== '').moveTo('loading')
      ```
  - ### updateContext()
    - This is to update the context that we initially created based on transitions.
    - `updateContext` allows us to do both partial and a complete update to the context, which ever is required while coding
    - Usage: 
      ```js
        loading
          .on('FAILED') 
          .moveTo('error')
          .updateContext({response: (context, event) => event.data.response})
      ```
    - However, if you want to define your updateContext before hand and find the above code not so readable. You can use `assign` function
      - ### assign()
        - Assign is a syntactial sugar of `updateContext`. Does pretty much the same work as `updateContext`
        - Usage:
          ```js
            const updateResponse = assign({
              response: (context, event) => event.data.response
            })

            loading
              .on('FAILED')
              .moveTo('error')
              .updateContext(updateResponse)
          ```
  - ### fireAndForget()
    - This is to make a call to an external library or to log the transition or do anything that is not related to the state machine
    - Usage:
      ```js
        loading
          .on('FAILED')
          .moveTo('error')
          .updateContext(updateResponse)
          .fireAndForget((context, event) => console.log(context, event))
      ```
