"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import clsx, { ClassValue } from "clsx";
import { AnimatePresence, motion } from "framer-motion";

import Progress from "@/components/animata/graphs/progress";
import Counter from "@/components/animata/text/counter";
import { DailiesState, useDailies } from "@/components/daily/providers/dailies";
import { isRealNumber, roundTo } from "@/lib/number";
import { cn } from "@/lib/utils";
import { Option } from "@/types/option";

// import { AppMetaState, useAppMetaState } from "@/app/providers/app-meta";
// import CursorTracker from "@/components/animata/container/cursor-tracker";

export default function ExpBar(): React.ReactNode {
  const dailiesState: DailiesState = useDailies();

  const previousTotalPointsRef = React.useRef<number | undefined>(undefined);
  const previousDateRef = React.useRef<CalendarDate>(dailiesState.date);

  if (previousDateRef.current.toString() !== dailiesState.date.toString()) {
    previousDateRef.current = dailiesState.date;
    previousTotalPointsRef.current = undefined;
  }

  const previousTotalPoints = previousTotalPointsRef.current;

  React.useEffect(() => { previousTotalPointsRef.current = dailiesState.totalPoints; }, [dailiesState.totalPoints]);

  const [percentChanges, setPercentChanges] = React.useState<PercentChangeItem[]>([]);
  const nextIdRef = React.useRef(0);

  React.useEffect(() => {
    const pointDiff: number = previousTotalPoints
      ? dailiesState.totalPoints - previousTotalPoints
      : 0;
    const x = pointDiff / dailiesState.totalWeight;
    const value = isRealNumber(x) ? roundTo(x * 100, 2) : 0;
    if (value !== 0 && previousTotalPoints !== undefined) {
      const id = nextIdRef.current++;
      setPercentChanges((prev) => [...prev, { id, value }]);
    }
  }, [previousTotalPoints, dailiesState.totalPoints, dailiesState.totalWeight]);

  const [percentValue, setPercentValue] = React.useState<Option<number>>(null);
  React.useEffect(() => {
    const x = dailiesState.totalPoints / dailiesState.totalWeight;
    const y = !Number.isNaN(x) && Number.isFinite(x) ? roundTo(x * 100, 2) : +``;
    setPercentValue(y);
  }, [dailiesState.totalPoints, dailiesState.totalWeight]);

  const dismissItem = React.useCallback((id: number) => { setPercentChanges((prev) => prev.filter((item) => item.id !== id)); }, []);

  const textClass: ClassValue = "text-xs font-bold text-[#f0f0ff]";

  return (
    <>
      <div className="absolute z-400 flex w-full flex-col-reverse items-end pr-10">
        <div className="absolute flex h-fit flex-col items-start justify-items-end overflow-hidden">
          <AnimatePresence mode="popLayout">
            {percentChanges.map((item) => (
              <PercentChangeToast
                key={item.id}
                item={item}
                textClass={textClass}
                onDismiss={dismissItem}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
      {dailiesState.isLoading ? (
        <div className="flex h-full max-h-10 min-h-10 w-full cursor-wait place-items-center pr-2 pl-2 opacity-40">
          <heroui.Skeleton className="dark size-full rounded-sm" id="exp-bar-skeleton" />
        </div>
      ) : (
        <div className="flex max-h-10 min-h-10 items-center gap-3 rounded pr-1 pl-2" id="exp-bar">
          <div className="flex w-full flex-col">
            <div className="w-full grow">
              <Progress<number>
                deps={[dailiesState.totalPoints, dailiesState.totalWeight]}
                progress={percentValue ?? 0}
              />
            </div>
            <div className="mt-1 flex w-full grow flex-row justify-end">
              <span className={cn(textClass, "opacity-80")}>[</span>
              {dailiesState.totalPoints > 0 ? (
                <Counter
                  className={cn(textClass, "opacity-80")}
                  direction="up"
                  format={(value: number): string => `${value.toFixed(2)}`}
                  targetValue={dailiesState.totalPoints}
                />
              ) : (
                <span className={cn(textClass, "opacity-80")}>0</span>
              )}
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
        </div>
      )}
    </>
  );

  // TODO(ayvi): re-add focus content
  // const appMeta: AppMetaState = useAppMetaState();

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
  //   case "android":
  //     return (
  //       <>
  //         <heroui.Popover backdrop="transparent" placement="top">
  //           <heroui.PopoverTrigger>{bar}</heroui.PopoverTrigger>
  //           <heroui.PopoverContent className="z-100 border-none bg-transparent shadow-none outline-none select-none">
  //             {focusContent}
  //           </heroui.PopoverContent>
  //         </heroui.Popover>
  //       </>
  //     );
  //   case "windows":
  //     return (
  //       <>
  //         {bar}
  //         <CursorTracker platform={appMeta.platform}>
  //           {focusContent}
  //           <div className={cn(paddingClass, "relative bottom-0 max-h-10 min-h-10 w-full")}></div>
  //         </CursorTracker>
  //       </>
  //     );
  //   default:
  //     return bar;
  // }
}

type PercentChangeItem = { id: number; value: number };

function PercentChangeToast(props: {
  item: PercentChangeItem;
  onDismiss: (id: number) => void;
  textClass: ClassValue;
}): React.ReactElement {
  const { item, onDismiss, textClass } = props;

  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 3000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  const pointSign = Math.sign(item.value);

  return (
    <motion.span
      key={item.id}
      layout
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        textClass,
        clsx(pointSign === 1 && "text-green-400", pointSign === -1 && "text-red-400"),
      )}
      exit={{ opacity: 0, y: -18 }}
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      {pointSign === 1 && "+"}
      {item.value}
      {"%"}
    </motion.span>
  );
}
