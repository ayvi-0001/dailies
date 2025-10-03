import React from "react";

import type { Routine } from "../../types/routines";
import RingChart from "../animata/graphs/ring-chart";

export default function WeightsLabel({
  routine,
}: {
  routine: Routine;
}): React.ReactNode {
  const WeightLabel = () => (
    <div className="flex flex-row justify-self-end">
      <p className="font-bold text-black">weight:</p>
      <div className="empty:w-1"></div>
      <p className="font-bold text-black decoration-2 underline-offset-2 underline decoration-blue-500/30">
        {routine.weight}
      </p>
    </div>
  );

  const WeightedValueLabel = () => {
    if (routine.value !== null) {
      return (
        <div className="flex flex-row justify-self-end">
          {/* TODO(ayvi) recalculate weighted value onChange http://ayvi:3000/ayvi/dailies/issues/5 */}
          <p className="font-bold text-black">weighted value:</p>
          <div className="empty:w-1"></div>
          <p className="font-bold text-black decoration-2 underline-offset-2 underline decoration-blue-500/30">
            {routine.weightedValue}
          </p>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-row">
      <div className="mr-3">
        <WeightLabel />
        <WeightedValueLabel />
      </div>
      {/* TODO(ayvi) calculate weight against daily total http://ayvi:3000/ayvi/dailies/issues/6 */}
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
