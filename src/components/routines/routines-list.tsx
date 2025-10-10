"use client";

import * as React from "react";

import * as WindowSize from "@/app/providers/window-size";
import { invoke } from "@tauri-apps/api/core";

import RoutineCard from "./card";
import SectionHeader from "./section-header";
import type { Routine } from "./types";

export default function RoutineList({ title }: { title: string }): React.ReactNode {
  const [routines, setRoutines] = React.useState<Routine[]>([]);
  const [weightedTotal, setWeightedValue] = React.useState<number>(0);
  const [totalWeight, setTotalWeight] = React.useState<number>(0);
  const [countRefreshDailies, setCountRefreshDailies] = React.useState<number>(0);

  const windowSize: WindowSize.WindowWidthState = WindowSize.useWidth();

  const triggerRefreshDailies: () => void = React.useCallback(() => {
    setCountRefreshDailies(countRefreshDailies + 1);
  }, [countRefreshDailies]);

  React.useEffect(() => {
    const get_routines = async (): Promise<void> => {
      await invoke<Routine[]>("get_routines")
        .then(result => setRoutines(result))
        .catch(console.error);
    };
    get_routines();

    const get_weighted_eval = async (): Promise<void> => {
      await invoke<WeightedEval>("get_weighted_eval", { date: "2025-10-03" })
        .then(result => {
          setTotalWeight(result.total_weight);
          setWeightedValue(result.weighted_total);
        })
        .catch(console.error);
    };
    get_weighted_eval();
  }, [countRefreshDailies]);

  return (
    <div className="mr-3 ml-3 grid gap-3 md:mr-0 md:ml-0 md:gap-4 lg:gap-5">
      <SectionHeader
        title={title}
        totalWeight={totalWeight}
        weightedTotal={weightedTotal}
        countRefreshDailies={countRefreshDailies}
      />
      {routines.map((value, index) => (
        <RoutineCard
          key={index}
          routine={value}
          totalWeight={totalWeight}
          windowWidth={windowSize.windowWidth}
          onRefreshAction={triggerRefreshDailies}
        />
      ))}
    </div>
  );
}

type WeightedEval = {
  weighted_total: number;
  total_weight: number;
};
