import * as React from "react";

import { cn } from "@/lib/utils";

import type { Daily } from "./types";

export default function QuestChainLabel({
  borderColor,
  bgColor,
  daily,
}: {
  accentColor?: string;
  borderColor?: string;
  bgColor?: string;
  daily: Daily;
}): React.ReactElement {
  return (
    <div className={cn(borderColor, bgColor, "h-35 border-2 align-middle outline-offset-4")}>
      <div className="flex h-full w-full items-center justify-center">
        <p className="rotate-180 font-mono text-xl font-medium [writing-mode:vertical-rl]">
          {daily.chain}
        </p>
      </div>
    </div>
  );
}
