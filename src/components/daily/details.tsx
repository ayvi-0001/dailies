import * as React from "react";

import { Badge } from "@/components/ui/badge";
import type { Option } from "@/types/option";

import type { Daily } from "./types";

export default function Details({ daily }: { daily: Daily }): React.ReactElement {
  const timeDetail: Option<string> =
    daily.timeMin !== null ? `time: ${daily.timeMin} ~ ${daily.timeMax}` : null;

  const daysDetail: Option<string> = daily.days?.length ? `days: ${daily.days}` : null;

  return (
    <div className="flex flex-col gap-1 justify-self-start font-mono text-black">
      <div>
        type: {/* TODO(ayvi): badge colors based on type http://ayvi:3000/ayvi/dailies/issues/47 */}
        <Badge className="rounded-full font-bold text-black" variant="outline">
          {daily.type}
        </Badge>
      </div>
      <div className="empty:h-6">{timeDetail}</div>
      <div className="empty:h-6">{daysDetail}</div>
    </div>
  );
}
