import * as React from "react";

import * as motion from "motion/react-client";
import {
  CalendarDateTime,
  Time,
  parseDate,
  parseDateTime,
  parseTime,
  toTime,
} from "@internationalized/date";
import clsx, { ClassValue } from "clsx";

import { LOCAL_TZ, formatDateTimeISO8601 } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { Daily, Quest } from "./types";

type CardBorderProps = Readonly<{
  children: React.ReactNode;
  daily: Daily;
  divProps: React.ComponentProps<"div">;
}>;

// TODO(ayvi): display days or hours until quest available http://ayvi:3000/ayvi/dailies/issues/159
export default function CardBorder(props: CardBorderProps): React.ReactElement {
  const { children, divProps, daily } = props;

  const cardDimensionStyles: ClassValue = "h-20 w-full";

  const now: CalendarDateTime = parseDateTime(formatDateTimeISO8601(new Date()));

  const raidStatus: RaidStatus = getRaidStatus(daily, now);

  const isQuestAvailableToday: boolean =
    daily.days && daily.days.length > 0
      ? daily.days.includes(now.toDate(LOCAL_TZ).getDay() - 1)
      : false;

  const borderClass: ClassValue = clsx(
    !!daily.archived
      ? "border-black"
      : raidStatus.isUpcoming || (daily.days && !isQuestAvailableToday)
        ? "border-slate-950/90"
        : raidStatus.isOver && daily.complete !== 1
          ? "border-red-950/90"
          : raidStatus.isOver && daily.complete === 1
            ? "border-green-950/90"
            : divProps.className,
  );

  const cardCoverClassValue: ClassValue = cn(
    borderClass,
    "absolute z-90 box-content h-full w-full shadow-lg",
  );

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
        {!!daily.archived ? (
          <div className={cn(cardCoverClassValue, cardDimensionStyles, "bg-black/70")}></div>
        ) : (raidStatus.isRaid && !raidStatus.isOpen) || (daily.days && !isQuestAvailableToday) ? (
          <div
            className={cn(
              clsx(
                "bg-slate-700/40",
                raidStatus.isOver && daily.complete === 1 && "bg-green-600/20",
                raidStatus.isOver && daily.complete !== 1 && "bg-red-600/20",
                daily.days &&
                  daily.days.includes(parseDate(daily.date).toDate(LOCAL_TZ).getDay() - 1) &&
                  daily.complete === 1 &&
                  "bg-green-600/20",
                daily.days &&
                  daily.days.includes(parseDate(daily.date).toDate(LOCAL_TZ).getDay() - 1) &&
                  daily.complete !== 1 &&
                  "bg-red-600/20",
                daily.days &&
                  !daily.days.includes(parseDate(daily.date).toDate(LOCAL_TZ).getDay() - 1) &&
                  "bg-slate-700/40",
              ),
              cardCoverClassValue,
              cardDimensionStyles,
            )}
          ></div>
        ) : (
          <></>
        )}
        <div className={cn("flex", cardDimensionStyles)}>{children}</div>
      </motion.div>
    </>
  );
}

type RaidStatus = {
  isRaid: boolean;
  isOpen: boolean;
  isOver: boolean;
  isUpcoming: boolean;
};

function getRaidStatus(daily: Daily, now: CalendarDateTime): RaidStatus {
  const cardTime: Time = toTime(now);

  const isRaid = [`${Quest.Type.QR}`].includes(daily.type) || !!(daily.timeStart && daily.timeEnd);

  const raidStatus: RaidStatus = {
    isRaid: isRaid,
    isOpen: false,
    isOver: false,
    isUpcoming: false,
  };

  if (parseDate(daily.date).compare(now) < 0) {
    raidStatus.isOver = true;
  } else if (daily.timeStart && daily.timeEnd) {
    const cardTimeRelativeToStart = Math.sign(cardTime.compare(parseTime(daily.timeStart)));
    const cardTimeRelativeToEnd = Math.sign(cardTime.compare(parseTime(daily.timeEnd)));
    if (cardTimeRelativeToStart === 1 && cardTimeRelativeToEnd === -1) raidStatus.isOpen = true;
    if (!raidStatus.isOpen && cardTimeRelativeToStart === -1) raidStatus.isUpcoming = true;
    if (!raidStatus.isOpen && cardTimeRelativeToEnd === 1) raidStatus.isOver = true;
  }

  return raidStatus;
}
