"use client";

import React from "react";
import { useEffect, useState } from "react";

import { invoke } from "@tauri-apps/api/core";

import type { Routine, Section } from "@/types/routines";

import RoutineCard from "./card";
import SectionHeader from "./section-header";

interface RoutineListProps extends Section {}

export default function RoutineList({
  title,
}: RoutineListProps): React.ReactNode {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [refreshRoutines, setRefreshRoutines] = useState<number>(0);

  // TODO(ayvi): useEffect individually for each daily, so refresh doesn't pull all dailies
  // http://ayvi:3000/ayvi/dailies/issues/34
  useEffect(() => {
    const get_routines = async () => {
      await invoke<Routine[]>("get_routines")
        .then((result) => setRoutines(result))
        .catch(console.error);
    };
    get_routines();
  }, [refreshRoutines]);

  const triggerRoutineRefresh = () => {
    setRefreshRoutines(refreshRoutines + 1);
  };

  return (
    <main>
      <SectionHeader title={title} />
      {routines.map((value, index) => (
        <RoutineCard
          key={index}
          routine={value}
          onRefreshAction={triggerRoutineRefresh}
        />
      ))}
    </main>
  );
}
