"use client";

import React from "react";
import { useEffect, useState } from "react";

import { invoke } from "@tauri-apps/api/core";

import type { Routine } from "@/types/routines";

import RoutineCard from "./card";
import SectionHeader from "./section-header";

export default function RoutineList({ title }: { title: string }): React.ReactNode {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [totalWeight, settotalWeight] = useState<number>(0);
  const [refreshRoutines, setRefreshRoutines] = useState<number>(0);

  // TODO(ayvi): useEffect individually for each daily, so refresh doesn't pull all dailies
  // http://ayvi:3000/ayvi/dailies/issues/34
  useEffect(() => {
    const get_routines = async () => {
      await invoke<Routine[]>("get_routines")
        .then(result => setRoutines(result))
        .catch(console.error);
    };
    get_routines();
  }, [refreshRoutines]);

  useEffect(() => {
    const get_total_eval_weight = async () => {
      await invoke<number>("get_total_eval_weight", { date: "2025-10-03" })
        .then(result => settotalWeight(result))
        .catch(console.error);
    };
    get_total_eval_weight();
  }, []);

  const triggerRoutineRefresh = () => {
    setRefreshRoutines(refreshRoutines + 1);
  };

  return (
    <div className="grid gap-3 ml-3 mr-3 md:ml-0 md:mr-0 md:gap-4 lg:gap-5">
      <SectionHeader title={title} totalWeight={totalWeight} />
      {routines.map((value, index) => (
        <RoutineCard
          key={index}
          routine={value}
          totalWeight={totalWeight}
          onRefreshAction={triggerRoutineRefresh}
        />
      ))}
    </div>
  );
}
