"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import type { CalendarDate } from "@internationalized/date";
import clsx, { ClassValue } from "clsx";
import { AnimatePresence, motion } from "framer-motion";

// import { AppMetaState, useAppMetaState } from "@/app/providers/app-meta";
// import CursorTracker from "@/components/animata/container/cursor-tracker";
import Progress from "@/components/animata/graphs/progress";
import Counter from "@/components/animata/text/counter";
import { DailiesState, useDailies } from "@/components/daily/providers/dailies";
import { isRealNumber, roundTo } from "@/lib/number";
import { cn } from "@/lib/utils";
import { Option } from "@/types/option";

export default function ExpBar(): React.ReactNode {
  const dailiesState: DailiesState = useDailies();
  // const appMeta: AppMetaState = useAppMetaState();

  const previousTotalPointsRef = React.useRef<number | undefined>(undefined);
  const previousDateRef = React.useRef<CalendarDate>(dailiesState.date);

  if (previousDateRef.current.toString() !== dailiesState.date.toString()) {
    previousDateRef.current = dailiesState.date;
    previousTotalPointsRef.current = undefined;
  }

  const previousTotalPoints = previousTotalPointsRef.current;

  React.useEffect(() => {
    previousTotalPointsRef.current = dailiesState.totalPoints;
  }, [dailiesState.totalPoints]);

  const [percentChange, setPercentChange] = React.useState<Option<number>>(null);
  const throttledPercentChange = ReactUse.useThrottle(percentChange, 2000);

  React.useEffect(() => {
    const pointDiff: number = previousTotalPoints
      ? dailiesState.totalPoints - previousTotalPoints
      : 0;
    const x = pointDiff / dailiesState.totalWeight;
    setPercentChange(isRealNumber(x) ? roundTo(x * 100, 2) : +``);
  }, [previousTotalPoints, dailiesState.totalPoints, dailiesState.totalWeight]);

  const [percentValue, setPercentValue] = React.useState<Option<number>>(null);
  React.useEffect(() => {
    const x = dailiesState.totalPoints / dailiesState.totalWeight;
    const y = !Number.isNaN(x) && Number.isFinite(x) ? roundTo(x * 100, 2) : +``;
    setPercentValue(y);
  }, [dailiesState.totalPoints, dailiesState.totalWeight]);

  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [isVisible, previousTotalPoints]);
  React.useEffect(() => {
    if (!!throttledPercentChange && previousTotalPoints !== undefined) setIsVisible(true);
  }, [throttledPercentChange, previousTotalPoints]);

  const textClass: ClassValue = "text-xs font-bold text-[#f0f0ff]";
  const paddingClass: ClassValue = "px-5 ml-1";

  const bar: React.ReactElement = (
    <>
      <AnimatePresence>
        {isVisible ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={cn(paddingClass, "relative z-400 flex w-full justify-end")}
            exit={{ opacity: 0, y: -18 }}
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            {formatExpAnimationSpan(textClass, throttledPercentChange)}
          </motion.div>
        ) : (
          <div className="relative flex w-full"></div>
        )}
      </AnimatePresence>
      <div
        className={cn(paddingClass, "flex max-h-10 min-h-10 items-center gap-3 rounded")}
        id="exp-bar"
      >
        {!dailiesState.isLoading ? (
          <div className="flex w-full flex-col">
            <div className="grow">
              <Progress<number>
                deps={[dailiesState.totalPoints, dailiesState.totalWeight]}
                progress={percentValue ?? 0}
              />
            </div>
            <div className="mt-1 flex w-full grow flex-row justify-end">
              <span className={cn(textClass, "opacity-80")}>[</span>
              <Counter
                className={cn(textClass, "opacity-80")}
                direction="up"
                format={(value: number): string => `${value.toFixed(2)}`}
                targetValue={dailiesState.totalPoints}
              />
              <span className={cn(textClass, "opacity-80")}>{`/${dailiesState.totalWeight}]`}</span>
              <Counter
                className={cn(textClass, "px-1")}
                direction="up"
                format={(value: number): string => `${value.toFixed(2)}%`}
                springOptions={{ damping: 10, stiffness: 80 }}
                targetValue={percentValue ?? 0}
              />
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
    </>
  );

  // TODO(ayvi): re-add focus content

  // const focusContent: React.ReactElement = (
  //   <div className="top-2 rounded-full bg-black/60 px-4 py-1">
  //     <span className={textClass}>
  //       <span className="pr-1">{dailiesState.totalPoints.toFixed(2)}</span>
  //       <span>{` / `}</span>
  //       <span>{dailiesState.totalWeight}</span>
  //     </span>
  //   </div>
  // );

  // switch (appMeta.platform) {
  // case "android":
  //   return (
  //     <>
  //       <heroui.Popover backdrop="transparent" placement="top">
  //         <heroui.PopoverTrigger>{bar}</heroui.PopoverTrigger>
  //         <heroui.PopoverContent className="z-100 border-none bg-transparent shadow-none outline-none select-none">
  //           {focusContent}
  //         </heroui.PopoverContent>
  //       </heroui.Popover>
  //     </>
  //   );
  // case "windows":
  //   return (
  //     <>
  //       {bar}
  //       <CursorTracker platform={appMeta.platform}>
  //         {focusContent}
  //         <div className={cn(paddingClass, "relative bottom-0 max-h-10 min-h-10 w-full")}></div>
  //       </CursorTracker>
  //     </>
  //   );
  // default:
  return bar;
  // }
}

function formatExpAnimationSpan(
  textClassValue: ClassValue,
  number: Option<number>,
): React.ReactElement<"span"> {
  if (number) {
    const pointSign = Math.sign(number);

    return (
      <span
        className={cn(
          textClassValue,
          clsx(pointSign === 1 && "text-green-400", pointSign === -1 && "text-red-400"),
        )}
      >
        {pointSign === 1 && "+"}
        {number}
        {"%"}
      </span>
    );
  }

  return <span></span>;
}
