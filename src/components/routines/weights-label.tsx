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
      <p className="empty:w-3 font-bold text-black">{routine.weight}</p>
      <div className="w-1"></div>
      <Weight className="fill-black stroke-2 stroke-black" />
    </div>
  );

  const WeightedValueLabel = () => {
    let displayValue: string;

    if (routineActive) {
      displayValue = `(${Math.round(routineValueContribution * 100) / 100}%) ${routine.weightedValue}`;
    } else {
      displayValue = `(-%)`;
    }

    return (
      <div className="flex flex-row justify-self-end">
        <p className="empty:w-3 font-bold text-black">{displayValue}</p>
        <div className="w-1"></div>
        <Function className="fill-black stroke-2 stroke-black " />
      </div>
    );
  };

  return (
    <div className="flex flex-row">
      <div className="mr-1 mt-3">
        <WeightLabel />
        <div className="m-1"></div>
        <WeightedValueLabel />
      </div>
      <div className="flex items-center h-12 mt-4 ml-2">
        <Separator
          orientation="vertical"
          decorative
          className="border-slate-400/80 border-1"
        />
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
