"use client";

import * as React from "react";

import { CalendarDate, Time, getDayOfWeek, parseDate, parseTime } from "@internationalized/date";
import { useCountDown } from "@reactuses/core";

import type { Option } from "@/types/option";

import { RaidStatus, getRaidStatus, toCalendarDateLocal } from "./editability";
import { type Daily, Quest } from "./types";

type RaidCountdownProps = {
  daily: Daily;
  minutelyRefresh: Date;
  prefix?: string;
};

const SECONDS_PER_DAY = 86400;

export default function RaidCountdown(props: RaidCountdownProps): Option<React.ReactElement> {
  const { daily, minutelyRefresh, prefix } = props;

  const status = getRaidStatus(daily, minutelyRefresh);
  const seconds: Option<number> = status.isOver
    ? getSecondsUntilNextRaid(daily, minutelyRefresh)
    : getSecondsUntilRaidOpen(daily, minutelyRefresh);
  if (seconds === null) return null;

  return (
    <RaidCountdownTimer
      key={`${daily.pointId}-${minutelyRefresh.getTime()}`}
      prefix={prefix}
      seconds={seconds}
    />
  );
}

type RaidCountdownTimerProps = {
  seconds: number;
  prefix?: string;
};

function RaidCountdownTimer(props: RaidCountdownTimerProps): React.ReactElement {
  const { seconds, prefix } = props;

  const days: number = Math.floor(seconds / SECONDS_PER_DAY);
  const [hours, minutes, secs] = useCountDown(seconds - days * SECONDS_PER_DAY);

  return (
    <div className="pointer-events-none absolute inset-0 z-95 mb-3 flex items-end justify-center">
      <span className="rounded-xs bg-black/70 px-2 py-0.5 font-mono text-xs font-bold tracking-tighter text-white tabular-nums drop-shadow-xs">
        {prefix}
        {days > 0 && `${days}d `}
        {hours}:{minutes}:{secs}
      </span>
    </div>
  );
}

export function getSecondsUntilNextRaid(daily: Daily, now: Date = new Date()): Option<number> {
  if (daily.type !== Quest.Type.QR) return null;
  if (!daily.days || daily.days.length === 0) return null;

  const start: Option<Time> = daily.timeStart ? parseTime(daily.timeStart) : null;
  const startHour: number = start?.hour ?? 0;
  const startMinute: number = start?.minute ?? 0;
  const startSecond: number = start?.second ?? 0;

  for (let offset = 0; offset <= 7; offset++) {
    const candidate: Date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      startHour,
      startMinute,
      startSecond,
      0,
    );
    const weekDay: number = getDayOfWeek(toCalendarDateLocal(candidate), "mon");
    if (!daily.days.includes(weekDay)) continue;

    const diffSeconds: number = Math.floor((candidate.getTime() - now.getTime()) / 1000);
    if (diffSeconds > 0) return diffSeconds;
  }

  return null;
}

export function getSecondsUntilRaidOpen(daily: Daily, now: Date = new Date()): Option<number> {
  const status: RaidStatus = getRaidStatus(daily, now);
  if (!status.isRaid || !status.isUpcoming) return null;

  const cardDate: CalendarDate = parseDate(daily.date);
  const start: Option<Time> = daily.timeStart ? parseTime(daily.timeStart) : null;

  const target: Date = new Date(
    cardDate.year,
    cardDate.month - 1,
    cardDate.day,
    start?.hour ?? 0,
    start?.minute ?? 0,
    start?.second ?? 0,
    0,
  );

  const diffSeconds: number = Math.floor((target.getTime() - now.getTime()) / 1000);
  return diffSeconds > 0 ? diffSeconds : null;
}
