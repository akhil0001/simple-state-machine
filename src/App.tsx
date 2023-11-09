import './App.css'
import 'reactflow/dist/style.css';
// import { Inspect } from './machine/inspect'
// import { inspect, subscribe } from './drag-and-drop.ts'
import { Rectangle } from './components/Rectangle.tsx';
import { ToolTip } from './components/ToolTip.tsx';
// import { inspect, subscribe } from '.'

function App() {

  return (
    <>
      <Rectangle />
      <ToolTip />
      {/* <Inspect inspect={inspect} subscribe={subscribe} /> */}
    </>
  )
}

export default App
