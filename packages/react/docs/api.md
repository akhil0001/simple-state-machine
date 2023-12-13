# API Documentation

### Table of Contents
- [API Documentation](#api-documentation)
    - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Using State Machine in React](#using-state-machine-in-react)


## Introduction
- If you have'nt gone through the `core` API documentation, it is recommended to go through the [Configuration step](../../core/docs/api.md#configuring-state-machine)
- React package is more about how to use state machine once it is configured.

## Using State Machine in React
- There are 2 hooks that can be primarily used for consuming a state machine in a react component
- 1. [`useMachine` hook](#usemachinemachineconfig-context-object-debug-boolean)
- 2. [`useSharedMachine` hook](#usesharedmachinemachineconfig)
    - ### useMachine(machineConfig, context?: object, debug?: boolean)
      - `useMachine` hook is used to consume the machineConfig in a react component and it returns an object that has the following properties
        - 1. [`state`](../../core/docs/using-in-js.md#state)
        - 2. [`send`](../../core/docs/using-in-js.md#send)
     - Example:
       ```jsx
        import {useMachine} from '@simple-state-machine/react';
        import CounterMachine from './counter-machine';
        
        function Counter() {
            const {state, send} = useMachine(CounterMachine);
            const increment = () => send('INCREMENT');
            return (
                <>
                    <p>Count: {state.context.count}</p>
                    <p>State: {state.value}</p>
                    <button onClick={increment}>Increment</button>
                </>
            )
        }
       ```
    - The above example demonstrates usage of CounterMachine that increments the count on click of the button.
    - What if we want to start our count from 10? We can pass the initial context that is patched to the context of machine config
    - Example:
      ```jsx
        import {useMachine} from '@simple-state-machine/react';
        import CounterMachine from './counter-machine';
        
        function Counter() {
            const {state, send} = useMachine(CounterMachine, {count: 10});
            const increment = () => send('INCREMENT');
            return (
                <>
                    <p>Count: {state.context.count}</p>
                    <p>State: {state.value}</p>
                    <button onClick={increment}>Increment</button>
                </>
            )
        }
      ```
    - ### useSharedMachine(machineConfig)
      - ⚠️ WARN: EXPERIMENTAL ⚠️
      - `useSharedMachine` hook is similar to `useMachine` hook except that this hook just uses one instance of the machine. 
      - To elaborate, in the above example we have a counter machine and one component that invokes it. If we want to share the same state across different components, either we need to do `prop-drilling` or use `createContext`.
      - Instead, what if we have a hook that could share the machine state across the users of the machine. The philosophy behind this hook that you can now share the state anywhere across the React tree
      - Example:
        ```jsx
        import {useSharedMachine} from '@simple-state-machine/react';
        import CounterMachine from './counter-machine';
        
        function CountDisplay() {
            const {state} = useSharedMachine(CounterMachine)
            return (
                <p>Counter: {state.context.count}</p>
            )
        }

        function IncrementButton() {
            const {send} = useSharedMachine(CounterMachine)        
            const increment = () => send('INCREMENT');
            return (
                <button onClick={increment}>Increment</button>
            )
        }

        function Counter() {
            const {state} = useSharedMachine(CounterMachine);
            const stateVal = state.value
            return (
                <>
                    <CounterDisplay />
                    <p>State: {stateVal} </p>
                    <IncrementButton />
                </>
            )
        }
        ```
