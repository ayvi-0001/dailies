"use client";

import * as React from "react";

import * as heroui from "@heroui/react";

import { AppMetaState, useAppMetaState } from "@/app/providers/app-meta";
import CursorTracker from "@/components/animata/container/cursor-tracker";
import Progress from "@/components/animata/graphs/progress";
import Counter from "@/components/animata/text/counter";
import { DailiesState, useDailies } from "@/components/daily/providers/dailies";
import { roundTo } from "@/lib/number";

export default function ExpBar(): React.ReactNode {
  const dailiesState: DailiesState = useDailies();
  const appMeta: AppMetaState = useAppMetaState();

  const totalPoints = dailiesState.totalPoints;
  const totalWeight = dailiesState.totalWeight;
  const countRefreshDailies = dailiesState.countRefreshDailies;

  let value: number = roundTo((totalPoints / totalWeight) * 100, 2);
  value = !Number.isNaN(value) ? value : +``;

  const bar: React.ReactElement = (
    <div className="flex h-10 items-center gap-3 rounded" id="exp-bar">
      {!!totalWeight ? (
        <>
          <div className="grow empty:w-12">
            <Counter
              className="text-sm text-white"
              direction="up"
              format={(value: number): string => `${value.toFixed(2)}%`}
              targetValue={value ?? 0}
            />
          </div>
          <div className="grow">
            <Progress<number> deps={[countRefreshDailies]} progress={value} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {totalWeight !== 0 && (totalWeight ?? "")}
            </p>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full flex-col">
          <heroui.Spinner
            as={"div"}
            className="dark z-1000"
            classNames={{ label: "text-foreground mt-4" }}
            variant="dots"
          />
        </div>
      )}
    </div>
  );

  const focusContent: React.ReactElement = (
    <div className="top-2 rounded-full bg-black/60 px-4 py-1">
      <span className="text-xs font-bold text-white">
        <span className="pr-1">{totalPoints.toFixed(2)}</span>
        <span>{` / `}</span>
        <span>{totalWeight}</span>
      </span>
    </div>
  );

  switch (appMeta.platform) {
    case "android":
      return (
        <>
          <heroui.Popover backdrop="transparent" placement="top">
            <heroui.PopoverTrigger>{bar}</heroui.PopoverTrigger>
            <heroui.PopoverContent className="z-100 border-none bg-transparent shadow-none outline-none select-none">
              {focusContent}
            </heroui.PopoverContent>
          </heroui.Popover>
        </>
      );
    case "windows":
      return (
        <>
          {bar}
          <CursorTracker platform={appMeta.platform}>
            {focusContent}
            <div className="absolute bottom-0 h-10 w-screen"></div>
          </CursorTracker>
        </>
      );
    default:
      return bar;
  }
}
