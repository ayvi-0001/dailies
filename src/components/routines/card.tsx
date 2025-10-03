"use client";

import React from "react";

import { Button } from "@/components/ui/button";

import type { Routine } from "../../types/routines";
import EditDialog from "./edit-dialog";
import ValueInput from "./value-input";
import WeightsLabel from "./weights-label";

export default function RoutineCard({
  routine,
}: {
  routine: Routine;
}): React.ReactNode {
  const Header = () => (
    <div className="flex flex-row mt-2">
      <p className="text-black font-bold text-4xl tracking-tight">
        {routine.name}
      </p>
      <div className="ml-10 mt-1">
        <Buttons />
      </div>
    </div>
  );

  const Buttons = () => (
    <div className="flex flex-wrap items-center md:flex-row gap-4">
      <EditDialog routine={routine} />
      {/* TODO(ayvi): editable history http://ayvi:3000/ayvi/dailies/issues/14 */}
      <Button variant="default" size="sm">
        history
      </Button>
    </div>
  );

  const GroupLabel = () => (
    <div className="w-8 h-full ml-2 bg-yellow-400 border-yellow-500 border-2">
      <div className="flex justify-center items-center w-full h-full">
        <p className="text-black font-mono font-medium text-xl rotate-180 [writing-mode:vertical-rl]">
          {routine.group}
        </p>
      </div>
    </div>
  );

  const Details = () => {
    let typeDetail: string | null = `type: ${routine.type}`;
    let timeDetail: string | null =
      routine.timeMin !== null
        ? `time: ${routine.timeMin} ~ ${routine.timeMax}`
        : null;
    let daysDetail: string | null = `${/* TODO(ayvi) weekdays */ ""}`;

    return (
      <div className="flex flex-col">
        {[typeDetail, timeDetail, daysDetail].map((detail, index) => (
          <div key={index} className="empty:h-6">
            {detail}
          </div>
        ))}
      </div>
    );
  };

  const Notes = () => (
    /* TODO(ayvi): clip notes text if too long http://ayvi:3000/ayvi/dailies/issues/10 */
    <div className="absolute inset-x-60 top-0 ml-50 m-5 w-5/10">
      <p className="overflow-hidden text-ellipsis">{routine.notes}</p>
    </div>
  );

  return (
    <div
      className="shadow-[0px_20px_207px_10px_rgba(255,_255,_255,_0.2)]"
      style={{
        background: "radial-gradient(circle at top, #1c1c1c, #000000)",
      }}
    >
      <div
        className="select-none border-4 box-content border-yellow-400/80 m-5 py-1 isolate bg-white/78 shadow-lg ring-1 ring-black/5 relative size-auto"
        style={{ height: 150 }}
      >
        <GroupLabel />
        <div className="absolute top-0 left-0 pl-14 flex flex-col">
          <Header />
        </div>
        <div className="absolute bottom-0 left-0 ml-14 mb-2 flex flex-row">
          <Details />
        </div>
        <Notes />
        <div className="absolute bottom-0 right-0 mr-6 mb-4">
          <ValueInput routine={routine} />
        </div>
        <div className="absolute top-0 right-0 mr-6 mt-4">
          <WeightsLabel routine={routine} />
        </div>
      </div>
    </div>
  );
}
