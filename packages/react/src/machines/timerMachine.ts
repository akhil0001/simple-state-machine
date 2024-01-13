import { createStates, createEvents, MachineConfig, createContext } from "@simple-state-machine/core";
  
  const states = createStates("idle", "running", "paused");
  const events = createEvents("UPDATE_TIME", "START", "STOP", "PAUSE");
  const context = createContext({
    time: 0,
    timeInput: 0
  });
  
  export const TimerMachine = new MachineConfig(states, context, events);
  
  const { idle, running, paused } = TimerMachine.getStates();
  
  idle.on("UPDATE_TIME").updateContext({ time: (_, event) => event.data.time, timeInput: (_, event) => event.data.time });
  idle.on("START").moveTo("running").updateContext({time: context => context.timeInput});
  paused.on("START").moveTo('running')
  running.on("PAUSE").moveTo("paused");
  running.on("STOP").moveTo("idle").updateContext({ time: 0 });
  running
    .after(1000)
    .moveTo("running")
    .updateContext({ time: (context) => context.time - 1 });
  
  running.always().if(context => context.time <= 0).moveTo('idle')