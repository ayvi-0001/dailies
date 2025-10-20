import * as React from "react";

import clsx from "clsx";

import * as svgs from "@/components/svgs";
import RingChart from "@/components/animata/graphs/ring-chart";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { roundTo } from "@/lib/number";
import type { Option } from "@/types/option";

import type { Daily } from "./types";

type PointsDisplayProps = {
  daily: Daily;
  points: Option<string>;
  totalWeight: number;
};

export default function PointsDisplay(props: PointsDisplayProps): React.ReactNode {
  const { daily, points, totalWeight } = props;

  const dailyTotalWeight: number = (daily.weight / totalWeight) * 100;
  const pointsWeighted: Option<string> = daily.pointsWeighted
    ? roundTo(daily.pointsWeighted, 2).toString()
    : null;
  const dailyPointsContribution: number = daily.pointsWeighted
    ? roundTo((daily.pointsWeighted / totalWeight) * 100, 2)
    : 0;

  const Weight = () => (
    <div className="mb-1 flex flex-row gap-2 justify-self-end">
      <p className="text-lg font-bold text-black empty:w-3">{daily.weight}</p>
      <svgs.Weight className="size-7 fill-black stroke-black stroke-2" />
    </div>
  );

  // TODO (ayvi): display negative?
  const WeightedPoints = () => {
    const displayPoints: string =
      (pointsWeighted && `(${dailyPointsContribution}%) ${pointsWeighted}`) || `(-%)`;

    return (
      <div className="flex flex-row gap-2 justify-self-end">
        <p className="text-lg font-bold text-black empty:w-3">{displayPoints}</p>
        <svgs.Function className="size-7 fill-black stroke-black stroke-2" />
      </div>
    );
  };

  // TODO(ayvi): visual component for streaks http://ayvi:3000/ayvi/dailies/issues/46
  const Streak = (): React.ReactElement | undefined => {
    if (daily.streak) {
      return (
        <HoverCard>
          <HoverCardTrigger>
            <div className="flex flex-row gap-2">
              <p className="text-lg font-bold text-black italic empty:w-3">
                {daily.streak}/{daily.streakTarget}
              </p>
              <svgs.TrailLength fill="#000000" className="size-7" />
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
          <Streak />
          <Weight />
        </div>
        <WeightedPoints />
      </div>
      <div className="mr-1 ml-3 h-14 place-content-center">
        <Separator orientation="vertical" className="border-2 border-slate-400/80" />
      </div>
      <div>
        <RingChart
          size={8}
          width={6}
          rings={[
            {
              progress: dailyPointsContribution,
              progressClassName: "text-green-900/70",
              trackClassName: clsx(
                "text-slate-500/30",
                +`${points}` > 0 && "text-green-500/30",
                +`${points}` === 0 && "text-red-500/30",
              ),
            },
            {
              progress: points !== null ? dailyTotalWeight : 0,
              progressClassName: "text-black/70",
              trackClassName: "text-black/20",
            },
          ]}
        />
      </div>
    </div>
  );
}
