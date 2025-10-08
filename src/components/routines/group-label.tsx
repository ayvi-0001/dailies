import React from "react";

import type { Routine } from "./types";

export default function GroupLabel({ routine }: { routine: Routine }): React.ReactElement {
  return (
    <div className="h-35 border-2 border-yellow-500 bg-yellow-400">
      <div className="flex h-full w-full items-center justify-center">
        <p className="rotate-180 font-mono text-xl font-medium [writing-mode:vertical-rl]">
          {routine.group}
        </p>
      </div>
    </div>
  );
}
