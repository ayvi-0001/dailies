import React from "react";

import type { Routine } from "../../types/routines";
import RingChart from "../animata/graphs/ring-chart";

export default function WeightsLabel({
  routine,
}: {
  routine: Routine;
}): React.ReactNode {
  return (
    <div className="flex flex-row">
      <div className="text-right mr-3">
        <p className="font-bold text-black">weight: {routine.weight}</p>
        <p className="font-bold text-black">
          {/* TODO(ayvi) recalculate weighted value onChange
              http://ayvi:3000/ayvi/dailies/issues/5 */}
          weighted value: {routine.weightedValue}
        </p>
      </div>
      {/* TODO(ayvi) calculate weight against daily total
          http://ayvi:3000/ayvi/dailies/issues/6 */}
      <RingChart
        size={10}
        width={5}
        className="bg-transparent"
        rings={[
          {
            progress: routine.weight * 10, // TEMP
            progressClassName: "text-black",
            trackClassName: "bg-black text-black/20",
          },
        ]}
      />
    </div>
  );
}
