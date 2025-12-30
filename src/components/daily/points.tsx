import * as React from "react";

import * as svgs from "@/components/svgs";
import { roundTo } from "@/lib/number";
import type { Option } from "@/types/option";

import type { Daily } from "./types";

type PointsDisplayProps = {
  daily: Daily;
  points: Option<string>;
  totalWeight: number;
};

export default function PointsDisplay(props: PointsDisplayProps): React.ReactNode {
  const { daily, points: _, totalWeight } = props;

  const pointsWeighted: Option<string> = daily.pointsWeighted
    ? roundTo(daily.pointsWeighted, 2).toString()
    : null;
  const dailyPointsContribution: number = daily.pointsWeighted
    ? roundTo((daily.pointsWeighted / totalWeight) * 100, 2)
    : 0;

  const Weight = () => (
    <div className="flex flex-row items-center gap-1">
      <div className="flex flex-row items-center justify-self-end">
        <p className="text-[0.55rem] leading-none font-bold text-black empty:w-3">{daily.weight}</p>
        <svgs.Weight className="size-4 fill-black" />
      </div>
    </div>
  );

  const WeightedPoints = () => {
    const displayPoints: React.ReactNode =
      daily.points === null
        ? ""
        : pointsWeighted
          ? `(${dailyPointsContribution}%) ${pointsWeighted}`
          : 0;

    return (
      <div className="flex flex-row items-center">
        <p className="flex-1 justify-self-start align-middle text-[0.55rem] leading-none font-bold text-black empty:w-3">
          {displayPoints}
        </p>
        <svgs.Function className="size-4 fill-black" />
      </div>
    );
  };

  const Streak = (): React.ReactElement | undefined => {
    if (daily.streak) {
      return (
        <div className="flex flex-row items-center gap-1">
          <p className="text-[0.55rem] leading-none font-bold text-black italic empty:w-3">
            {daily.streak}/{daily.streakTarget}
          </p>
          <svgs.TrailLength className="size-4" fill="#000000" />
        </div>
      );
    }
  };

  return (
    <div className="flex flex-row items-center justify-self-end">
      <div>
        <div className="flex flex-row items-center gap-1 justify-self-end align-middle">
          <Streak />
          <Weight />
        </div>
        <div className="flex flex-row gap-1 justify-self-end align-middle">
          <WeightedPoints />
        </div>
      </div>
    </div>
  );
}
