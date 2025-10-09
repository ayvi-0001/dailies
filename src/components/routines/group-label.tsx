import React from "react";

import { cn } from "@/lib/utils";

import type { Routine } from "./types";

export default function GroupLabel({
  borderColor,
  bgColor,
  routine,
}: {
  accentColor?: string;
  borderColor?: string;
  bgColor?: string;
  routine: Routine;
}): React.ReactElement {
  return (
    <div
      className={cn(borderColor, bgColor, "h-35 border-2 align-middle text-white outline-offset-4")}
    >
      <div className="flex h-full w-full items-center justify-center">
        <p className="rotate-180 font-mono text-xl font-medium [writing-mode:vertical-rl]">
          {routine.group}
        </p>
      </div>
    </div>
  );
}
