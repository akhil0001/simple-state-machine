import {
  MachineConfig,
  interpret,
  createStates,
  createEvents,
  createContext,
} from "../lib";

const machineStates = createStates("idle", "fething");

const events = createEvents("fetching", "lol");

const context = createContext({ count: 0 });

const someMachine = new MachineConfig(machineStates, context, events);

const { idle, fething } = someMachine.getStates();

idle.always()
    .moveTo("fething");
idle.on("fetching")
    .updateContext({ count: (context) => context.count + 1 });

someMachine.on("fetching")
    .moveTo("fething");

const machine = interpret(someMachine);

machine.send({ type: "fetching", data: {} });
