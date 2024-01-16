# react

## Installation

```
    npm i @simple-state-machine/core @simple-state-machine/react
```

## Quick Glance

```jsx
    import {useMachine} from '@simple-state-machine/react'
    import ThemeMachine from './theme-machine';

    function Theme({children}){
        const {state, send} = useMachine(ThemeMachine)
        const themeClassName = state.value === 'light' ? 'light-mode' : 'dark-mode'
        const toggleTheme = () => send('TOGGLE');

        return (
            <>
                <button onClick={toggleTheme}>Toggle Theme</button>
                <div className={themeClassName}>
                    {children}
                </div>
            </>
        )
    }
```

### API

- If you are new to `simple-state-machine`, it is recommended to go through the [core package](../core/README.md)
- In order to understand the API in depth, please go through the [api-documentation](../react/docs/api.md)

## Examples
- [Debounced Input](https://codesandbox.io/p/sandbox/debounce-stg462)
- [Polling API](https://codesandbox.io/p/sandbox/polling-463vsz)

## Tutorial
- [Timer App](./docs/tutorial.md)