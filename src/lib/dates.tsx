import {
  CalendarDate,
  ZonedDateTime,
  getLocalTimeZone,
  now,
  parseDate,
} from "@internationalized/date";

import { isNumeric } from "./number";
import Utils from "./utils";

export const LOCAL_TZ = getLocalTimeZone();

export enum WeekDays {
  Mon = 0,
  Tue = 1,
  Wed = 2,
  Thu = 3,
  Fri = 4,
}

export enum WeekEnds {
  Sat = 5,
  Sun = 6,
}

export const DaysOfWeek = {
  ...WeekDays,
  ...WeekEnds,
};

const getDaysOfWeek = (e: typeof WeekDays | typeof WeekEnds): number[] => { return [...Object.keys(e)].filter((v) => isNumeric(v)).map((v) => +v); };

export const isWeekend = (days: number[]): boolean =>
  Utils.identicalArrays<number>([...getDaysOfWeek(WeekEnds)], days);

export const isWeekDay = (days: number[]): boolean =>
  Utils.identicalArrays<number>([...getDaysOfWeek(WeekDays)], days);

export const isEveryDay = (days: number[]): boolean => {
  return Utils.identicalArrays<number>(
    [...getDaysOfWeek(WeekDays), ...getDaysOfWeek(WeekEnds)],
    days,
  );
};

export function formatDateTimeISO8601(date: Date, tzOffset: boolean = false): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  if (!tzOffset) return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
  const tzOffsetMinutes = -date.getTimezoneOffset();
  const tzOffsetHours = Math.floor(Math.abs(tzOffsetMinutes) / 60)
    .toString()
    .padStart(2, "0");
  const tzOffsetRemainingMinutes = (Math.abs(tzOffsetMinutes) % 60).toString().padStart(2, "0");
  const tzSign = tzOffsetMinutes >= 0 ? "+" : "-";
  const timezoneOffset = `${tzSign}${tzOffsetHours}:${tzOffsetRemainingMinutes}`;

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${timezoneOffset}`;
}

export function formatDateISO8601(date: Date | string): string {
  if (typeof date === "string") {
    const parsedDate = parseDate(date);
    return new CalendarDate(parsedDate.year, parsedDate.month, parsedDate.day).toString();
  } else {
    return new CalendarDate(date.getFullYear(), date.getMonth(), date.getDay()).toString();
  }
}

export const getMsToMidnight = (): number => {
  const currentDateTime: ZonedDateTime = now(LOCAL_TZ);
  const midnight = currentDateTime
    .cycle("day", 1)
    .cycle("hour", 24 - currentDateTime.hour)
    .cycle("minute", 60 - currentDateTime.minute)
    .cycle("second", 60 - currentDateTime.second)
    .cycle("millisecond", 1000 - currentDateTime.millisecond);
  return midnight.compare(currentDateTime);
};
