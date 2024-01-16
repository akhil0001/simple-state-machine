import { useMachine } from "../../lib";
import { TimerMachine } from "../machines/timerMachine.ts";
import React from "react";

export const Timer = () => {
  const { state, send } = useMachine(TimerMachine);
  const { time, timeInput } = state.context;

  const isRunning = state.matchesAny('running')


  const updateTime = (e) => send('UPDATE_TIME', {time: e.currentTarget.value})
  const stop = () => send("STOP");
  const start = () => send("START");
  const pause = () => send("PAUSE");

  return (
    <>
      <h1>{time}</h1>
      <input
        type="number"
        disabled={isRunning}
        value={timeInput}
        onChange={updateTime}
      />
      <button disabled={isRunning} onClick={start}>
        Start
      </button>
      <button disabled={!isRunning} onClick={pause}>
        Pause
      </button>
      <button disabled={!isRunning} onClick={stop}>
        Stop
      </button>
    </>
  );
};
