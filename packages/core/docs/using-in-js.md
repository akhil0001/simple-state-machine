# Usage of State Machine in Javascript

## createMachine()
- `createMachine()` function takes 3 parameters
  - 1. Machine Config object
  - 2. context (optional)
  - 3. debug (optional)
- And this function returns the following
  - [state](#state)
  - [send](#send)
  - [subscribe](#subscribe)
  - [start]
- Usage:
  ```js
  const {state, start, send, subscribe} = createMachine(FetchingMachine);
  ```
- **Alert:** Every time `createMachine` is called, a new instance of Fetching Machine is called and it does not share the states of the other instances of the same machine

## state
- `state` is an object that has 3 values in it
  - `value`: which represents the current state value and is in string format
  - `history`: this is the previous state value from which it transitioned to current state.
  - `context`: this is the context of the state machine in the current state
- Usage:
  ```js
    // checks if the current state is idle
    console.log(state.value === 'idle')
    // prints the url stored inside the context
    console.log(state.context.url)
    // prints the previous state value
    console.log(state.history)
  ```

### send()
- `send` is a function that is used to send the `events` to state machine to perform actions or transitions
- send function takes in either a string or an object of this format `{type: 'CLICK', data: {}}`
- Usage:
  ```js
    send('CLICK');

    // if we want to send some data
    send({
        type: 'CLICK',
        data: {
            mouseX: 10,
            mouseY: 100
        }
    })
  ```

### subscribe()
- subscribe function takes in 2 parameters
  - 1. either `allChanges` or `stateChange`
  - 2. a callback that notifies the developer about the subscribed changes
- `allChanges` is the default option which allows the user to subscribe to all the changes that occur. There are generally 2 changes here: State changes and context changes. Not all times, we would like to subscribe to all the changes. Whereas `stateChange` just subscribes to state value changes
- Usage:
  ```js
    subscribe('stateChange', (state) => {
        // logs everytime there is a state value change
        console.log(state.value)
    })

    // all changes
    subscribe('allChanges', (state) => {
        document.querySelector('p').innerText = state.context.response
    })
  ```

### start()
- `start` function actually starts the function execution
- Usage: 
  ```js
    // write this after all the subscriptions
    start();
  ```