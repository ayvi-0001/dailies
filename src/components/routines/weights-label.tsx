import React from "react";

import RingChart from "@/components/animata/graphs/ring-chart";
import { Function, Weight } from "@/components/svgs";
import { Separator } from "@/components/ui/separator";

import type { Routine } from "@/types/routines";

export default function WeightsLabel({
  routine,
  inputValue,
  totalWeight,
}: {
  routine: Routine;
  inputValue: number | null;
  totalWeight: number;
}): React.ReactNode {
  let routineActive: boolean = inputValue !== null;

  let routineTotalWeight: number = (routine.weight / totalWeight) * 100;
  let routineValueContribution: number = routine.weightedValue
    ? (routine.weightedValue / totalWeight) * 100
    : 0;

  const WeightLabel = () => (
    <div className="flex flex-row justify-self-end">
      <p className="font-bold text-black empty:w-3">{routine.weight}</p>
      <div className="w-1"></div>
      <Weight className="fill-black stroke-black stroke-2" />
    </div>
  );

  const WeightedValueLabel = () => {
    let displayValue: string;

    if (routineActive) {
      displayValue = `(${Math.round(routineValueContribution * 100) / 100}%) ${routine.weightedValue && Math.round(routine.weightedValue * 100) / 100}`;
    } else {
      displayValue = `(-%)`;
    }

    return (
      <div className="flex flex-row justify-self-end">
        <p className="font-bold text-black empty:w-3">{displayValue}</p>
        <div className="w-1"></div>
        <Function className="fill-black stroke-black stroke-2" />
      </div>
    );
  };

  return (
    <div className="flex flex-row">
      <div className="mt-3 mr-1">
        <WeightLabel />
        <div className="m-1"></div>
        <WeightedValueLabel />
      </div>
      <div className="mt-4 ml-2 flex h-12 items-center">
        <Separator orientation="vertical" decorative className="border-1 border-slate-400/80" />
      </div>
      <RingChart
        size={8}
        width={6}
        className="bg-transparent"
        rings={[
          {
            progress: routineValueContribution,
            progressClassName: "text-green-900",
            trackClassName: "bg-black text-green-500/30",
          },
          {
            progress: routineActive ? routineTotalWeight : 0,
            progressClassName: "text-black/70",
            trackClassName: "bg-black text-black/20",
          },
        ]}
      />
    </div>
  );
}
