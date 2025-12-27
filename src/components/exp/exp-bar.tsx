"use client";

import * as React from "react";

import CursorTracker from "@/components/animata/container/cursor-tracker";
import Progress from "@/components/animata/graphs/progress";
import Counter from "@/components/animata/text/counter";
import { DailiesState, useDailies } from "@/components/daily/context";
import { roundTo } from "@/lib/number";

export default function ExpBar(): React.ReactNode {
  const dailiesState: DailiesState = useDailies();

  const totalPoints = dailiesState.totalPoints;
  const totalWeight = dailiesState.totalWeight;
  const countRefreshDailies = dailiesState.countRefreshDailies;

  let value: number = roundTo(totalPoints / totalWeight, 2);
  value = !Number.isNaN(value) ? value : +``;

  return (
    <>
      <div className="flex h-10 items-center gap-3 rounded" id="exp-bar">
        <div className="grow empty:w-12">
          <Counter
            className="text-sm text-white"
            direction="up"
            format={(value: number): string => `${roundTo(value, 2).toFixed(2)}%`}
            targetValue={value ?? 0}
          />
        </div>
        <div className="grow">
          <Progress<number> deps={[countRefreshDailies]} progress={value * 100} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{totalWeight}</p>
        </div>
      </div>
      <CursorTracker>
        <div>{`${totalPoints.toPrecision(2)} / ${totalWeight}`}</div>
        <div className="absolute bottom-0 h-10 w-screen"></div>
      </CursorTracker>
    </>
  );
}
