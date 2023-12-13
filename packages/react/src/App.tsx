import './App.css'
import { counterMachine } from './machines/counterMachine'
import { Debounce } from './components/Debounce'
import { Throttle } from './components/Throttle'
import React from 'react'
import { Timer } from './components/Timer'
import { EvenOrOdd } from './EvenOrOdd'
import { useSharedMachine } from '../lib'

function App() {
  const { state, send } = useSharedMachine(counterMachine)
  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => send('increment')}>
            Increment
        </button>
        <EvenOrOdd />
        <p>
          State Value: {state.value}
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <Debounce />
      <Throttle />
      <Timer />
    </>
  )
}

export default App
