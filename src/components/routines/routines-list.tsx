"use client";

import { invoke } from "@tauri-apps/api/core";
import React from "react";
import { useEffect, useState } from "react";

import type { Routine } from "../../types/routines";
import type { Section } from "../../types/routines";
import RoutineCard from "./card";
import SectionHeader from "./section-header";

interface RoutineListProps extends Section {}

export default function RoutineList({
  title,
}: RoutineListProps): React.ReactNode {
  const [routines, setRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    const get_routines = async () => {
      await invoke<Routine[]>("get_routines")
        .then((result) => setRoutines(result))
        .catch(console.error);
    };
    get_routines();
  }, []);

  return (
    <main>
      <SectionHeader title={title} />
      {routines.map((value, index) => (
        <RoutineCard key={index} routine={value} />
      ))}
    </main>
  );
}
