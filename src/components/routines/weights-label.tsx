import React from "react";

import RingChart from "@/components/animata/graphs/ring-chart";

import type { Routine } from "@/types/routines";

export default function WeightsLabel({
  routine,
  inputValue,
  setInputValueAction,
}: {
  routine: Routine;
  inputValue: number | null;
  setInputValueAction: React.Dispatch<React.SetStateAction<number | null>>;
}): React.ReactNode {
  const WeightLabel = () => (
    <div className="flex flex-row justify-self-end">
      <p className="font-bold text-black">weight:</p>
      <div className="w-5"></div>
      <p className="empty:w-3 font-bold text-black decoration-2 underline-offset-2 underline decoration-blue-500/30">
        {routine.weight}
      </p>
    </div>
  );

  const WeightedValueLabel = () => {
    if (inputValue !== null) {
      return (
        <div className="flex flex-row justify-self-end">
          {/* TODO(ayvi) recalculate weighted value onChange http://ayvi:3000/ayvi/dailies/issues/5 */}
          <p className="font-bold text-black">weighted value:</p>
          <div className="w-5"></div>
          <p className="empty:w-3 font-bold text-black decoration-2 underline-offset-2 underline decoration-blue-500/30">
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
