## TODO

- [x] hook - introduce config to accept default context values
- [x] createMachine - introduce unsubscribe method. useful for hooks
- [x] core - support async functions like promises
- [x] createMachine - support async function calls 
- [x] core - Pass context support to `after` method
- [x] createMachine - handle function as an argument to `after` method
- [x] refactor -  Remove machine code from index.ts file
- [x] core - support machine level transitions
- [x] createMachine - handle machine level tranisitions
- [x] issue - unchain the chainedActionType in the State class and Machine class
  
- [ ] hook - create atom like shared state and slices of listeners
- [ ] hook - Figure a way to pass subscription type to `useMachine`
- [ ] tests - Start writing test cases for machines
- [ ] core - handle multiple `after`, `always` and `services`
- [ ] createmachine - handle multiple `after`, `always` and `services`
- [ ] example - build dino game using state machine
- [ ] core - what if there is a way to restrict the events on machine level with **`exceptWhenIn`**
- [ ] core - Move away from the usage of `protected` ES' actual `private` variables
- [ ] createMachine - Have a similar func like assign of xstate
- [ ] experiment - lets try integrating mermaid with this
- [ ] issue - The state value from `useMachine` does not seem to be updated properly with the actual value