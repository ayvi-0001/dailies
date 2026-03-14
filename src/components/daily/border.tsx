import * as React from "react";

import * as motion from "motion/react-client";
import {
  CalendarDate,
  CalendarDateTime,
  Time,
  getDayOfWeek,
  parseDate,
  parseDateTime,
  parseTime,
  toTime,
} from "@internationalized/date";
import clsx, { ClassValue } from "clsx";

import { formatDateTimeISO8601 } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Option } from "@/types/option";

import { Daily, Quest } from "./types";

type CardBorderProps = Readonly<{
  children: React.ReactNode;
  daily: Daily;
  divProps: React.ComponentProps<"div">;
}>;

// TODO(ayvi): display days or hours until quest available http://ayvi:3000/ayvi/dailies/issues/159
export default function CardBorder(props: CardBorderProps): React.ReactElement {
  const { children, divProps, daily } = props;

  const cardWeekDay: number = getDayOfWeek(parseDate(daily.date), "mon");

  const [minutelyRefresh, setMinutelyRefresh] = React.useState<Date>(new Date());
  React.useEffect(() => {
    const now = new Date();
    const secondsUntilNextMinute = 60 - now.getSeconds();
    const millisecondsUntilNextMinute = secondsUntilNextMinute * 1000;

    const initialTimeoutId = setTimeout(() => {
      setMinutelyRefresh(new Date());
      const intervalId = setInterval(() => setMinutelyRefresh(new Date()), 60 * 1000);
      return () => clearInterval(intervalId);
    }, millisecondsUntilNextMinute);

    return () => clearTimeout(initialTimeoutId);
  }, []);

  const [raidStatus, setRaidStatus] = React.useState<Option<RaidStatus>>(null);
  React.useEffect(() => {
    setRaidStatus(getRaidStatus(daily, cardWeekDay));
  }, [daily, cardWeekDay, minutelyRefresh]);
  const [weeklyStatus, setWeeklyStatus] = React.useState<Option<WeeklyStatus>>(null);
  React.useEffect(() => {
    setWeeklyStatus(getWeeklyStatus(daily, cardWeekDay));
  }, [daily, cardWeekDay]);

  const cardDimensionStyles: ClassValue = "h-20 w-full";
  const borderClass: ClassValue = cn(
    divProps.className,
    raidStatus?.borderClassValue,
    weeklyStatus?.borderClassValue,
    clsx([!!daily.archived && "border-black"]),
  );
  const bgClass: ClassValue = cn(
    raidStatus?.bgClassValue,
    weeklyStatus?.bgClassValue,
    clsx([!!daily.archived && "bg-black/70"]),
  );
  const cardCoverClassValue: ClassValue = cn(
    borderClass,
    "absolute z-90 box-content h-full w-full shadow-lg",
  );

  let isNotEditable: boolean = false;
  if (!!daily.archived) {
    isNotEditable = true;
  }
  if (
    raidStatus?.isRaid &&
    [!raidStatus.isOpen, raidStatus.isUpcoming, raidStatus.isOver].some(Boolean)
  ) {
    isNotEditable = true;
  }
  if (weeklyStatus?.isWeekly && !weeklyStatus?.isAvailable) {
    isNotEditable = true;
  }

  return (
    <>
      <motion.div
        className={cn(
          cardDimensionStyles,
          borderClass,
          "relative z-90 box-content border-3 bg-white/70 shadow-lg",
        )}
        id={`daily-${daily.name}`}
        whileFocus={{ scale: 1.02 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 1.02 }}
      >
        {isNotEditable ? (
          <div className={cn(cardCoverClassValue, cardDimensionStyles, bgClass)} />
        ) : (
          <></>
        )}
        <div className={cn("flex", cardDimensionStyles)}>{children}</div>
      </motion.div>
    </>
  );
}

type RaidStatus = {
  isDaysFinished: boolean;
  isDaysRemaining: boolean;
  isOpen: boolean;
  isOver: boolean;
  isRaid: boolean;
  isToday: boolean;
  isUpcoming: boolean;
  borderClassValue: ClassValue;
  bgClassValue: ClassValue;
};

function getRaidStatus(daily: Daily, cardWeekDay: number): RaidStatus {
  const now: CalendarDateTime = parseDateTime(formatDateTimeISO8601(new Date()));

  const status: RaidStatus = {
    isDaysFinished: false,
    isDaysRemaining: false,
    isOpen: false,
    isOver: false,
    isRaid: [Quest.Type.QR].includes(daily.type),
    isToday: false,
    isUpcoming: false,
    borderClassValue: null,
    bgClassValue: null,
  };

  if (status.isRaid && daily.days) {
    const cardDate: CalendarDate = parseDate(daily.date);

    if (cardDate.compare(now) < 0) {
      status.isOver = true;
    } else {
      const currentTime: Time = toTime(now);

      const latestAvailableDayOfWeek = Math.max(...daily.days);
      status.isDaysFinished = latestAvailableDayOfWeek < cardWeekDay;
      status.isToday = cardDate.compare(parseDate(now.toString().substring(0, 10))) === 0;
      status.isDaysRemaining = latestAvailableDayOfWeek >= getDayOfWeek(now, "mon");

      if (status.isDaysFinished) {
        status.isOver = true;
      } else if (daily.timeStart && daily.timeEnd) {
        const dailyTimeStart = parseTime(daily.timeStart);
        const nowRelativeToStart = Math.sign(currentTime.compare(dailyTimeStart)) as -1 | 0 | 1;
        const dailyTimeEnd = parseTime(daily.timeEnd);
        const nowRelativeToEnd = Math.sign(currentTime.compare(dailyTimeEnd)) as -1 | 0 | 1;

        if (cardWeekDay < getDayOfWeek(now, "mon")) {
          status.isOver = true;
        } else if (!(`${daily.days}`.indexOf(`${cardWeekDay}`) > 0) && status.isDaysRemaining) {
          status.isUpcoming = true;
        } else if (status.isToday && nowRelativeToStart >= 0 && nowRelativeToEnd < 0) {
          status.isOpen = true;
        } else if (status.isToday && nowRelativeToEnd === 1) {
          status.isOver = true;
        } else if (status.isToday && nowRelativeToStart === -1) {
          status.isUpcoming = true;
          // } else if (status.isDaysRemaining) {
          //   status.isUpcoming = true;
        }
      }
    }
  }

  status.borderClassValue = clsx([
    status.isOver && "border-slate-950/90",
    status.isOver && daily.complete !== 1 && "border-red-950/90",
    status.isOver && daily.complete === 1 && "border-green-950/90",
    status.isDaysFinished && "border-slate-950/90",
    status.isUpcoming && "border-slate-950/90",
  ]);

  status.bgClassValue = clsx([
    status.isOver && "bg-slate-950/60",
    status.isOver && daily.complete !== 1 && "bg-red-600/20",
    status.isOver && daily.complete === 1 && "bg-green-600/20",
    status.isDaysFinished && "bg-slate-950/60",
    status.isUpcoming && "bg-slate-700/40",
  ]);

  return status;
}

type WeeklyStatus = {
  isWeekly: boolean;
  isAvailable: boolean;
  borderClassValue: ClassValue;
  bgClassValue: ClassValue;
};

function getWeeklyStatus(daily: Daily, cardWeekDay: number): WeeklyStatus {
  const status: WeeklyStatus = {
    isWeekly: [Quest.Type.QW].includes(daily.type),
    isAvailable: false,
    borderClassValue: null,
    bgClassValue: null,
  };

  if (status.isWeekly && daily.days && daily.days.length > 0 && daily.days.includes(cardWeekDay)) {
    status.isAvailable = true;
  }

  status.borderClassValue = clsx([
    status.isWeekly && !status.isAvailable && "border-slate-950/90",
    status.isWeekly && !status.isAvailable && daily.complete === 1 && "border-green-950/90",
    status.isWeekly && !status.isAvailable && daily.complete !== 1 && "border-red-950/90",
    status.isWeekly && !status.isAvailable && daily.complete === null && "border-slate-950/90",
  ]);

  status.bgClassValue = clsx([
    status.isWeekly && !status.isAvailable && "border-slate-950/90",
    status.isWeekly && !status.isAvailable && daily.complete === 1 && "bg-green-600/20",
    status.isWeekly && !status.isAvailable && daily.complete !== 1 && "bg-red-600/20",
    status.isWeekly && !status.isAvailable && daily.complete && daily.complete > 0 && "",
    status.isWeekly && !status.isAvailable && daily.complete === null && "bg-slate-950/60",
  ]);

  return status;
}
