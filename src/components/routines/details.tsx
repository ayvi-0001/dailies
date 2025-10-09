import React from "react";

import { Badge } from "@/components/ui/badge";

import type { Routine } from "./types";

export default function Details({ routine }: { routine: Routine }): React.ReactElement {
  let timeDetail: string | null =
    routine.timeMin !== null ? `time: ${routine.timeMin} ~ ${routine.timeMax}` : null;

  let weekdays: string[] | null = (routine.weekdays?.slice(1, -1) || "")
    .split(",")
    .filter((value: string) => value != "");

  let daysDetail: string | null = weekdays?.length ? `days: ${weekdays}` : null;

  return (
    <div className="flex flex-col gap-1 justify-self-start font-mono text-black">
      <div>
        type: {/* TODO(ayvi): badge colors based on type http://ayvi:3000/ayvi/dailies/issues/47 */}
        <Badge className="rounded-full font-bold text-black" variant="outline">
          {routine.type}
        </Badge>
      </div>
      <div className="empty:h-6">{timeDetail}</div>
      <div className="empty:h-6">{daysDetail}</div>
    </div>
  );
}
