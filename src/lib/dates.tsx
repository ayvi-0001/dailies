import { CalendarDate, getLocalTimeZone, parseDate } from "@internationalized/date";

export const LOCAL_TZ = getLocalTimeZone();

export enum Weekdays {
  Mon,
  Tue,
  Wed,
  Thu,
  Fri,
  Sat,
  Sun,
}

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
