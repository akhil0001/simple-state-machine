import { createStates, createEvents, createContext, MachineConfig, interpret } from "../lib";

  console.log('entered')
  const states = createStates("idle", "running");
  const events = createEvents("UPDATE_TIME", "START", "PAUSE", "STOP");
  const context = createContext({ time: 0 });
  
  const timerMachine = new MachineConfig(states, context, events);
  const { idle, running } = timerMachine.getStates();
  
  idle.on("UPDATE_TIME").updateContext({ time: (_, event) => event.data.time });
  idle.on("START").moveTo("running");
  
  running.on("PAUSE").moveTo("idle");
  running.on("STOP").moveTo("idle").updateContext({ time: 0 });
  running
    .after(1000)
    .moveTo("running")
    .updateContext({ time: (context) => context.time - 1 })
  
  const machine = interpret(timerMachine, {time: 100});
  machine.subscribe((state) => console.log('timer state', state.context.time))
  machine.start();
  machine.send("START");