# Usage of State Machine in Javascript

## interpret()
- `interpret()` function takes 3 parameters
  - 1. Machine Config object
  - 2. context (optional)
- And this function returns the following
  - [state](#state)
  - [send](#send)
  - [subscribe](#subscribe)
  - [start]
- Usage:
  ```js
  const {state, start, send, subscribe} = interpret(FetchingMachine);
  ```
- **Alert:** Every time `interpret` is called, a new instance of Fetching Machine is called and it does not share the states of the other instances of the same machine

## state
- `state` is an object that has 3 values in it
  - `value`: which represents the current state value and is in string format
  - `matchesAny`: a util function that can be used to test the state value across different values. Returns true or false based on the matching
  - `context`: this is the context of the state machine in the current state
- Usage:
  ```js
    // checks if the current state is idle
    console.log(state.value === 'idle')
    // prints the url stored inside the context
    console.log(state.context.url)
    // returns true if the state matches matches any one of them, else returns false
    console.log(state.matchesAny('idle', 'loading'))
  ```

### send()
- `send` is a function that is used to send the `events` to state machine to perform actions or transitions
- send function takes in event's name as string and custom data as second parameter and is optional
- Usage
  ```js
    send('CLICK')

    // to send custom data
    send('CLICK', {
      mouseX: 10,
      mouseY: 100
    })
  ```
### subscribe()
- subscribe function takes a callback that notifies the developer about the subscribed changes
- Usage:
  ```js
    subscribe((state) => {
        console.log(state.value)
        console.log(state.context)
    })
  ```

### start()
- `start` function actually starts the function execution
- Usage: 
  ```js
    // write this after all the subscriptions
    start();
  ```