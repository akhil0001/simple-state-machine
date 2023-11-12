import './App.css'
import 'reactflow/dist/style.css';
// import { Inspect } from './machine/inspect'
// import { inspect, subscribe } from './drag-and-drop.ts'
// import { Rectangle } from './components/Rectangle.tsx';
// import { ToolTip } from './components/ToolTip.tsx';
import { TimerContainer } from './components/TimerContainer.tsx';
import { FetchContainer } from './components/FetchContainer.tsx';
import { DebounceContainer } from './components/DebounceContainer.tsx';
// import { inspect, subscribe } from '.'

function App() {

  return (
    <>
      {/* <Rectangle />
      <ToolTip /> */}
      <TimerContainer initialTime={10} />
      <hr />
      <FetchContainer />
      <hr />
      <DebounceContainer />
      {/* <Inspect inspect={inspect} subscribe={subscribe} /> */}
    </>
  )
}

export default App
