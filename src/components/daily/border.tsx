import * as React from "react";

import * as motion from "motion/react-client";
import { CalendarDate } from "@internationalized/date";
import clsx, { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

import {
  RaidStatus,
  WeeklyStatus,
  getRaidStatus,
  getWeeklyStatus,
  toCalendarDateLocal,
} from "./editability";
import RaidCountdown from "./raid-countdown";
import { Daily } from "./types";

type CardBorderProps = Readonly<{
  children: React.ReactNode;
  daily: Daily;
  divProps: React.ComponentProps<"div">;
  isEditable: boolean;
  minutelyRefresh: Date;
}>;

const MemoizedCardBorder = React.memo(CardBorder);
export default MemoizedCardBorder;

function CardBorder(props: CardBorderProps): React.ReactElement {
  const { children, divProps, daily, isEditable, minutelyRefresh } = props;

  const today: CalendarDate = toCalendarDateLocal(new Date());

  const raidStatus: RaidStatus = React.useMemo(
    () => getRaidStatus(daily, minutelyRefresh),
    [daily, minutelyRefresh],
  );
  const weeklyStatus: WeeklyStatus = React.useMemo(
    () => getWeeklyStatus(daily, minutelyRefresh),
    [daily, minutelyRefresh],
  );

  const raidLocked = raidStatus.isRaid && !raidStatus.isOpen;
  const weeklyLocked = weeklyStatus.isWeekly && !weeklyStatus.isAvailable;

  const raidBorderClass: ClassValue = clsx([
    raidStatus.isOver && "border-slate-950/90",
    raidStatus.isOver && daily.complete !== 1 && "border-red-950/90",
    raidStatus.isOver && daily.complete === 1 && "border-green-950/90",
    raidStatus.isUpcoming && "border-slate-950/90",
  ]);

  const raidBgClass: ClassValue = clsx([
    raidStatus.isOver && "bg-slate-950/60",
    raidStatus.isOver && daily.complete !== 1 && "bg-red-600/20",
    raidStatus.isOver && daily.complete === 1 && "bg-green-600/20",
    raidStatus.isUpcoming && "bg-slate-700/40",
  ]);

  const weeklyBorderClass: ClassValue = clsx([
    weeklyLocked && "border-slate-950/90",
    weeklyLocked && daily.complete === 1 && "border-green-950/90",
    weeklyLocked && daily.complete !== 1 && daily.complete !== null && "border-red-950/90",
  ]);

  const weeklyBgClass: ClassValue = clsx([
    weeklyLocked && daily.complete === null && "bg-slate-950/60",
    weeklyLocked && daily.complete === 1 && "bg-green-600/20",
    weeklyLocked && daily.complete !== 1 && daily.complete !== null && "bg-red-600/20",
  ]);

  return (
    <motion.div
      layout
      className={cn(
        "relative z-90 max-h-[88] min-h-[88] max-w-full min-w-full border-3 bg-white/70",
        divProps.className,
        raidBorderClass,
        weeklyBorderClass,
        clsx([!!daily.archived && "border-black"]),
      )}
      id={`daily-${daily.name}`}
      whileFocus={{ scale: 1.03 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 1.03 }}
    >
      {!isEditable && (raidLocked || weeklyLocked || !!daily.archived) && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute z-90 size-full",
            raidBgClass,
            weeklyBgClass,
            clsx([!!daily.archived && "bg-black/70"]),
          )}
          id="uneditable-card-cover"
        />
      )}
      {raidStatus.isUpcoming && !daily.archived && (
        <RaidCountdown
          daily={daily}
          minutelyRefresh={minutelyRefresh}
          prefix="Time until raid opens: "
        />
      )}
      {raidStatus.isOver && daily.date == today.toString() && (
        <RaidCountdown
          daily={daily}
          minutelyRefresh={minutelyRefresh}
          prefix="Time until next raid: "
        />
      )}
      <div className={cn("flex size-full")}>{children}</div>
    </motion.div>
  );
}
