import React from "react";

import { Badge } from "@/components/ui/badge";

import type { Option } from "@/types/option";

import type { Routine } from "./types";

export default function Details({ routine }: { routine: Routine }): React.ReactElement {
  const timeDetail: Option<string> =
    routine.timeMin !== null ? `time: ${routine.timeMin} ~ ${routine.timeMax}` : null;

  const weekdays: Option<string[]> = (routine.weekdays?.slice(1, -1) || "")
    .split(",")
    .filter((value: string) => value != "");

  const daysDetail: Option<string> = weekdays?.length ? `days: ${weekdays}` : null;

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
