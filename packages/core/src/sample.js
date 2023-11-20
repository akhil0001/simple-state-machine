import {
  MachineConfig,
  createMachine,
  createStates,
  createEvents,
} from "../lib";

const machineStates = createStates("idle", "fething");

const events = createEvents("fetching", "lol");

const someMachine = new MachineConfig(machineStates, { count: 0 }, events);

const { idle, fething } = someMachine.getStates();

idle.always().moveTo("fething");
idle.on("fetching");

someMachine.on("fetching").moveTo("fething");

const machine = createMachine(someMachine);

machine.send({ type: "fetching", data: {} });
