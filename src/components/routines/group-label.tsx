import React from "react";

import type { Routine } from "@/types/routines";

export default function GroupLabel({ routine }: { routine: Routine }): React.ReactElement {
  return (
    <div className="h-35 bg-yellow-400 border-yellow-500 border-2">
      <div className="flex justify-center items-center w-full h-full">
        <p className="font-mono font-medium text-xl rotate-180 [writing-mode:vertical-rl]">
          {routine.group}
        </p>
      </div>
    </div>
  );
}
