import { CalendarDate, Time, getDayOfWeek, parseDate, parseTime } from "@internationalized/date";

import { Daily, Quest } from "./types";

export type RaidStatus = {
  isRaid: boolean;
  isOpen: boolean;
  isUpcoming: boolean;
  isOver: boolean;
};

export type WeeklyStatus = {
  isWeekly: boolean;
  isAvailable: boolean;
};

const RAID_INACTIVE: RaidStatus = {
  isRaid: false,
  isOpen: false,
  isUpcoming: false,
  isOver: false,
};

const WEEKLY_INACTIVE: WeeklyStatus = {
  isWeekly: false,
  isAvailable: false,
};

export function toCalendarDateLocal(d: Date): CalendarDate {
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function toTimeLocal(d: Date): Time {
  return new Time(d.getHours(), d.getMinutes(), d.getSeconds());
}

export function getRaidStatus(daily: Daily, now: Date = new Date()): RaidStatus {
  if (daily.type !== Quest.Type.QR) return RAID_INACTIVE;
  if (!daily.days || daily.days.length === 0) return { ...RAID_INACTIVE, isRaid: true };

  const cardDate: CalendarDate = parseDate(daily.date);
  const today: CalendarDate = toCalendarDateLocal(now);
  const dateCmp: number = cardDate.compare(today);
  const cardWeekDay: number = getDayOfWeek(cardDate, "mon");
  const isScheduledDay: boolean = daily.days.includes(cardWeekDay);

  if (dateCmp < 0) return { isRaid: true, isOpen: false, isUpcoming: false, isOver: true };

  if (!isScheduledDay) {
    return { isRaid: true, isOpen: false, isUpcoming: false, isOver: true };
  }

  if (dateCmp > 0) {
    return { isRaid: true, isOpen: false, isUpcoming: true, isOver: false };
  }

  if (!daily.timeStart || !daily.timeEnd) {
    return { isRaid: true, isOpen: true, isUpcoming: false, isOver: false };
  }

  const currentTime: Time = toTimeLocal(now);
  const startCmp: number = currentTime.compare(parseTime(daily.timeStart));
  const endCmp: number = currentTime.compare(parseTime(daily.timeEnd));

  if (startCmp < 0) return { isRaid: true, isOpen: false, isUpcoming: true, isOver: false };
  if (endCmp >= 0) return { isRaid: true, isOpen: false, isUpcoming: false, isOver: true };
  return { isRaid: true, isOpen: true, isUpcoming: false, isOver: false };
}

export function getWeeklyStatus(daily: Daily, now: Date = new Date()): WeeklyStatus {
  if (daily.type !== Quest.Type.QW) return WEEKLY_INACTIVE;
  if (!daily.days || daily.days.length === 0) return { isWeekly: true, isAvailable: false };

  const cardDate: CalendarDate = parseDate(daily.date);
  const today: CalendarDate = toCalendarDateLocal(now);
  const cardWeekDay: number = getDayOfWeek(cardDate, "mon");

  const isToday: boolean = cardDate.compare(today) === 0;
  const isScheduledDay: boolean = daily.days.includes(cardWeekDay);

  return { isWeekly: true, isAvailable: isToday && isScheduledDay };
}

export function isDailyEditable(daily: Daily, now: Date = new Date()): boolean {
  if (daily.archived) return false;

  const raid = getRaidStatus(daily, now);
  if (raid.isRaid && !raid.isOpen) return false;

  const weekly = getWeeklyStatus(daily, now);
  if (weekly.isWeekly && !weekly.isAvailable) return false;

  return true;
}
