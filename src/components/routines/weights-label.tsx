import React from "react";

import RingChart from "@/components/animata/graphs/ring-chart";
import { Function, TrailLength, Weight } from "@/components/svgs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";

import type { Routine } from "./types";

export default function WeightsLabel({
  routine,
  inputValue,
  totalWeight,
}: {
  routine: Routine;
  inputValue: string | null;
  totalWeight: number;
}): React.ReactNode {
  let routineActive: boolean = inputValue !== null;

  let routineTotalWeight: number = (routine.weight / totalWeight) * 100;
  let routineValueContribution: number = routine.weightedValue
    ? (routine.weightedValue / totalWeight) * 100
    : 0;

  const WeightLabel = () => (
    <div className="mb-1 flex flex-row justify-self-end">
      <p className="font-bold text-black empty:w-3">{routine.weight}</p>
      <Weight className="ml-1 fill-black stroke-black stroke-2" />
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
        <Function className="ml-1 fill-black stroke-black stroke-2" />
      </div>
    );
  };

  // TODO(ayvi): visual component for streaks http://ayvi:3000/ayvi/dailies/issues/46
  const StreakLabel = (): React.ReactElement | undefined => {
    if (routine.streak) {
      return (
        <HoverCard>
          <HoverCardTrigger>
            <div className="mr-5 mb-1 flex flex-row">
              <p className="mr-2 font-bold text-black italic empty:w-3">
                {routine.streak}/{routine.nDays}
              </p>
              <TrailLength fill="#000000" />
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
    <div className="flex flex-row">
      <div className="mt-3 mr-1">
        <div className="flex flex-row justify-self-end">
          <StreakLabel />
          <WeightLabel />
        </div>
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
