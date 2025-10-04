"use client";

import React from "react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";

import type { Routine } from "@/types/routines";

import EditDialog from "./edit-dialog";
import HistoryDrawer from "./history-drawer";
import ValueInput from "./value-input";
import WeightsLabel from "./weights-label";

export default function RoutineCard({
  routine,
}: {
  routine: Routine;
}): React.ReactNode {
  const RoutineActions = (): React.ReactElement => {
    return (
      <div className="flex flex-wrap items-center md:flex-row gap-4">
        <EditDialog routine={routine} />
        <HistoryDrawer routine={routine} />
      </div>
    );
  };

  const Header = (): React.ReactElement => (
    <div className="flex flex-row mt-2">
      <p className="text-black font-bold text-4xl tracking-tight">
        {routine.name}
      </p>
      <div className="ml-10 mt-1">
        <RoutineActions />
      </div>
    </div>
  );

  const GroupLabel = (): React.ReactElement => (
    <div className="w-8 h-full ml-4 bg-yellow-400 border-yellow-500 border-2">
      <div className="flex justify-center items-center w-full h-full">
        <p className="text-black font-mono font-medium text-xl rotate-180 [writing-mode:vertical-rl]">
          {routine.group}
        </p>
      </div>
    </div>
  );

  const Details = (): React.ReactElement => {
    let timeDetail: string | null =
      routine.timeMin !== null
        ? `time: ${routine.timeMin} ~ ${routine.timeMax}`
        : null;
    let daysDetail: string | null =
      !Array.isArray(routine.weekdays) || !routine.weekdays.length
        ? null
        : `days: ${routine.weekdays}`;

    return (
      <div className="flex flex-col">
        <div>
          type:{" "}
          <Badge
            className="bg-slate-400 border-yellow-600 font-bold h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
            variant={"outline"}
          >
            {routine.type}
          </Badge>
        </div>
        <div className="empty:h-6">{timeDetail}</div>
        <div className="empty:h-6">{daysDetail}</div>
      </div>
    );
  };

  const Notes = (): React.ReactElement => (
    /* TODO(ayvi): clip notes text if too long http://ayvi:3000/ayvi/dailies/issues/10 */
    <div className="absolute inset-x-60 top-0 ml-50 m-5 w-5/10">
      <p className="overflow-hidden text-ellipsis">{routine.notes}</p>
    </div>
  );

  const [inputValue, setInputValue] = useState<number | null>(routine.value);

  return (
    <div
      className="select-none box-content border-yellow-400/80 m-5 py-1 isolate bg-white/78 shadow-lg ring-1 ring-black/5 relative size-auto transition-all duration-300 ease-in-out hover:border-yellow/40 hover:translate-y-[-1px] hover:shadow-lg border-4"
      style={{ height: 150 } as React.CSSProperties}
    >
      <GroupLabel />
      <div className="absolute top-0 left-0 ml-16">
        <Header />
      </div>
      <div className="absolute bottom-0 left-0 ml-16 mb-2">
        <Details />
      </div>
      <Notes />
      <div className="absolute bottom-0 right-0 mr-6 mb-4">
        <ValueInput
          routine={routine}
          inputValue={inputValue}
          setInputValueAction={setInputValue}
        />
      </div>
      <div className="absolute top-0 right-0 mr-6 mt-4">
        <WeightsLabel
          routine={routine}
          inputValue={inputValue}
          setInputValueAction={setInputValue}
        />
      </div>
    </div>
  );
}
