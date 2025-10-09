import React from "react";

import { roundTo } from "@/lib/number";

import RingChart from "@/components/animata/graphs/ring-chart";
import { Function, TrailLength, Weight } from "@/components/svgs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";

import type { Option } from "@/types/option";

import type { Routine } from "./types";

export default function WeightsLabel({
  routine,
  inputValue,
  totalWeight,
}: {
  routine: Routine;
  inputValue: Option<string>;
  totalWeight: number;
}): React.ReactNode {
  let routineActive: boolean = inputValue !== null;

  let routineTotalWeight: number = (routine.weight / totalWeight) * 100;
  let weightedValue: Option<string> = routine.weightedValue
    ? roundTo(routine.weightedValue, 2).toString()
    : null;
  let routineValueContribution: number = routine.weightedValue
    ? roundTo((routine.weightedValue / totalWeight) * 100, 2)
    : 0;

  const WeightLabel = () => (
    <div className="mb-1 flex flex-row gap-2 justify-self-end">
      <p className="text-lg font-bold text-black empty:w-3">{routine.weight}</p>
      <Weight className="size-7 fill-black stroke-black stroke-2" />
    </div>
  );

  const WeightedValueLabel = () => {
    let displayValue: string =
      (weightedValue && `(${routineValueContribution}%) ${weightedValue}`) || `(-%)`;

    return (
      <div className="flex flex-row gap-2 justify-self-end">
        <p className="text-lg font-bold text-black empty:w-3">{displayValue}</p>
        <Function className="size-7 fill-black stroke-black stroke-2" />
      </div>
    );
  };

  // TODO(ayvi): visual component for streaks http://ayvi:3000/ayvi/dailies/issues/46
  const StreakLabel = (): React.ReactElement | undefined => {
    if (routine.streak) {
      return (
        <HoverCard>
          <HoverCardTrigger>
            <div className="flex flex-row gap-2">
              <p className="text-lg font-bold text-black italic empty:w-3">
                {routine.streak}/{routine.nDays}
              </p>
              <TrailLength fill="#000000" className="size-7" />
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="bg-black/70">
            <p className="text-sm text-white">current streak</p>
          </HoverCardContent>
        </HoverCard>
      );
    }
  };

  return (
    <div className="flex">
      <div>
        <div className="flex flex-row gap-4 justify-self-end align-middle">
          <StreakLabel />
          <WeightLabel />
        </div>
        <WeightedValueLabel />
      </div>
      <div className="mr-1 ml-3 h-14 place-content-center">
        <Separator orientation="vertical" className="border-2 border-slate-400/80" />
      </div>
      <div>
        <RingChart
          size={8}
          width={6}
          className="bg-transparent"
          rings={[
            {
              progress: routineValueContribution,
              progressClassName: routineValueContribution ? "text-green-900" : "text-red-900",
              trackClassName: !routineActive
                ? "bg-transparent text-slate-500/30"
                : routineValueContribution
                  ? "bg-black text-green-500/30"
                  : "bg-black text-red-500/30",
            },
            {
              progress: routineActive ? routineTotalWeight : 0,
              progressClassName: "text-black/70",
              trackClassName: "bg-black text-black/20",
            },
          ]}
        />
      </div>
    </div>
  );
}
