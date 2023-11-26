import { createStates, createEvents, MachineConfig, createContext } from "@simple-state-machine/core";
  
  const states = createStates("idle", "running");
  const events = createEvents("UPDATE_TIME", "START", "STOP", "PAUSE");
  const context = createContext({
    time: 0,
  });
  
  export const TimerMachine = new MachineConfig(states, context, events);
  
  const { idle, running } = TimerMachine.getStates();
  
  idle.on("UPDATE_TIME").updateContext({ time: (_, event) => event.data.time });
  idle.on("START").moveTo("running");
  
  running.on("PAUSE").moveTo("idle");
  running.on("STOP").moveTo("idle").updateContext({ time: 0 });
  running
    .after(1000)
    .moveTo("running")
    .updateContext({ time: (context) => context.time - 1 });
  