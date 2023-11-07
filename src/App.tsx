import './App.css'
import 'reactflow/dist/style.css';
import { Inspect } from './machine/inspect'
import { inspect, subscribe } from './drag-and-drop.ts'

function App() {

  return (
    <>
      <Inspect inspect={inspect} subscribe={subscribe} />
    </>
  )
}

export default App
