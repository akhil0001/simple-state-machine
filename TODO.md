## TODO

- [x] hook - introduce config to accept default context values
- [x] createMachine - introduce unsubscribe method. useful for hooks
- [x] core - support async functions like promises
- [x] createMachine - support async function calls 
- [x] core - Pass context support to `after` method
- [x] createMachine - handle function as an argument to `after` method
  
- [ ] hook - create atom like shared state and slices of listeners
- [ ] refactor -  Remove machine code from index.ts file
- [ ] hook - Figure a way to pass subscription type to `useMachine`
- [ ] tests - Start writing test cases for machines
- [ ] core - handle multiple `after`, `always` and `services`
- [ ] createmachine - handle multiple `after`, `always` and `services`
- [ ] core - support machine level transitions
- [ ] createMachine - handle machine level tranisitions
- [ ] example - build dino game using state machine
- [ ] core - what if there is a way to restrict the events on machine level with `exceptWhenIn`