import React from "react";

import { Badge } from "@/components/ui/badge";

import type { Routine } from "./types";

export default function Details({ routine }: { routine: Routine }): React.ReactElement {
  let timeDetail: string | null =
    routine.timeMin !== null ? `time: ${routine.timeMin} ~ ${routine.timeMax}` : null;

  let weekdays = routine.weekdays?.slice(1, -1).split(",");
  let daysDetail: string | null =
    !Array.isArray(weekdays) || !weekdays.length ? null : `days: ${weekdays}`;

  return (
    <div className="flex flex-col font-mono text-black">
      <div className="justify-self-start">
        type:{" "}
        <Badge
          className="rounded-full border-yellow-600 bg-slate-400 font-bold text-black"
          variant="outline"
        >
          {routine.type}
        </Badge>
      </div>
      <div className="empty:h-6">{timeDetail}</div>
      <div className="empty:h-6">{daysDetail}</div>
    </div>
  );
}
