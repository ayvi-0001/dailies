"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
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

  const textClass: ClassValue = "text-xs font-bold text-[#f0f0ff]";
  const paddingClass: ClassValue = "px-5 ml-1";

  const showExpToast: boolean = isVisible && !!percentChange && previousTotalPoints !== undefined;
  const bar: React.ReactElement = (
    <>
      <AnimatePresence>
        {showExpToast ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={cn(paddingClass, "relative z-400 flex w-full justify-end")}
            exit={{ opacity: 0, y: -18 }}
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <p
              className={cn(
                textClass,
                clsx(pointSign === 1 && "text-green-400", pointSign === -1 && "text-red-400"),
              )}
            >
              {pointSign === 1 && "+"}
              {percentChange}
              {"%"}
            </p>
          </motion.div>
        ) : (
          <div className="relative flex w-full"></div>
        )}
      </AnimatePresence>
      <div
        className={cn(paddingClass, "flex max-h-10 min-h-10 items-center gap-3 rounded")}
        id="exp-bar"
      >
        {!!totalPoints ? (
          <div className="flex w-full flex-col">
            <div className="grow">
              <Progress<number> deps={[totalPoints, totalWeight]} progress={percentValue ?? 0} />
            </div>
            <div className="mt-1 flex w-full grow flex-row justify-end">
              <span className={cn(textClass, "opacity-80")}>[</span>
              <Counter
                className={cn(textClass, "opacity-80")}
                direction="up"
                format={(value: number): string => `${value.toFixed(2)}`}
                targetValue={totalPoints}
              />
              <span className={cn(textClass, "opacity-80")}>{`/${totalWeight}]`}</span>
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
  //       <span className="pr-1">{totalPoints.toFixed(2)}</span>
  //       <span>{` / `}</span>
  //       <span>{totalWeight}</span>
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
