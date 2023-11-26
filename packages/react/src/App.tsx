import { useMachine } from '../lib'
import './App.css'
import { counterMachine } from './machines/counterMachine'
import { Debounce } from './components/Debounce'
import { Throttle } from './components/Throttle'
import React from 'react'

function App() {
  const { state, send } = useMachine(counterMachine)
  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => send('increment')} style={{ color: state.value === 'even' ? 'green' : 'red' }}>
          count is {state.context.count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <p>
          State Value: {state.value}
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <Debounce />
      <Throttle />
    </>
  )
}

export default App
