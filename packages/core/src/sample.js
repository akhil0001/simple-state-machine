const { MachineConfig, tuple, actionTuple } = require("../lib/MachineConfig");
const { createMachine } = require("../lib/createMachine");

const machineStates = tuple("idle", "fething");
const actions = actionTuple("idle", "lol");
const someMachine = new MachineConfig(machineStates, { count: 0 }, actions);

const { idle, fething } = someMachine.getStates();

idle.always().moveTo("fething");
idle.on("lol");

someMachine.on("idle").moveTo("fething");

const machine = createMachine(someMachine);

machine.send("lol");
