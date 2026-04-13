"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import clsx, { ClassValue } from "clsx";
import { AnimatePresence, motion } from "framer-motion";

import { AppMetaState, useAppMetaState } from "@/app/providers/app-meta";
import CursorTracker from "@/components/animata/container/cursor-tracker";
import Progress from "@/components/animata/graphs/progress";
import Counter from "@/components/animata/text/counter";
import { DailiesState, useDailies } from "@/components/daily/providers/dailies";
import { isRealNumber, roundTo } from "@/lib/number";
import { cn } from "@/lib/utils";
import { Option } from "@/types/option";

export default function ExpBar(): React.ReactNode {
  const dailiesState: DailiesState = useDailies();
  const appMeta: AppMetaState = useAppMetaState();

  const totalPoints = dailiesState.totalPoints;
  const totalWeight = dailiesState.totalWeight;

  const previousTotalPoints = ReactUse.usePrevious(totalPoints);

  const pointDiff: number = previousTotalPoints ? totalPoints - previousTotalPoints : 0;
  const pointSign = Math.sign(pointDiff);

  const [percentChange, setPercentChange] = React.useState<Option<number>>(null);

  React.useEffect(() => {
    let x: Option<number>;
    x = roundTo((pointDiff / totalWeight) * 100, 2);
    x = isRealNumber(x) ? x : null;
    setPercentChange(x);
  }, [pointDiff, totalPoints, totalWeight]);
  React.useEffect(() => setPercentChange(null), [dailiesState.date]);

  let percentValue: number = roundTo((totalPoints / totalWeight) * 100, 2);
  percentValue = !Number.isNaN(percentValue) && Number.isFinite(percentValue) ? percentValue : +``;

  const [isVisible, setIsVisible] = React.useState(true);
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [isVisible]);
  React.useEffect(() => setIsVisible(true), [previousTotalPoints]);

  const textClassValue: ClassValue = "text-xs font-bold text-[#f0f0ff]";

  const showExpToast: boolean = isVisible && !!percentChange && previousTotalPoints !== undefined;
  const key: string = `point-diff-${pointDiff}`;
  const bar: React.ReactElement = (
    <AnimatePresence>
      {showExpToast ? (
        <motion.div
          key={key}
          animate={{ opacity: 1, y: 0 }}
          className="z-100 -mb-2 flex w-full justify-end"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <p
            className={cn(
              textClassValue,
              clsx(pointSign === 1 && "text-green-400", pointSign === -1 && "text-red-400"),
            )}
          >
            {pointSign === 1 && "+"}
            {percentChange}
            {"%"}
          </p>
        </motion.div>
      ) : (
        <div key={key} className="flex w-full justify-self-end" id={key}></div>
      )}
      <div className="flex h-10 items-center gap-3 rounded" id="exp-bar">
        {!!totalPoints ? (
          <div className="flex w-full flex-col">
            <div className="flex w-full grow flex-row justify-end">
              <span className={cn(textClassValue, "opacity-80")}>[</span>
              <Counter
                className={cn(textClassValue, "opacity-80")}
                direction="up"
                format={(value: number): string => `${value.toFixed(2)}`}
                targetValue={totalPoints}
              />
              <span className={cn(textClassValue, "opacity-80")}>{`/${totalWeight}]`}</span>
              <Counter
                className={cn(textClassValue, "px-1")}
                direction="up"
                format={(value: number): string => `${value.toFixed(2)}%`}
                springOptions={{ damping: 10, stiffness: 80 }}
                targetValue={percentValue ?? 0}
              />
            </div>
            <div className="grow">
              <Progress<number> deps={[totalPoints, totalWeight]} progress={percentValue} />
            </div>
          </div>
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
    </AnimatePresence>
  );

  const focusContent: React.ReactElement = (
    <div className="top-2 rounded-full bg-black/60 px-4 py-1">
      <span className={textClassValue}>
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
