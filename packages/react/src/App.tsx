import { useMachine } from '../lib'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { counterMachine } from './machines/counterMachine'
import { Debounce } from './components/Debounce'

function App() {
  const { state, send } = useMachine(counterMachine)
  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => send('increment')}>
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
    </>
  )
}

export default App
