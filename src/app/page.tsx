import React from "react";

import { RoutineList } from "@/components/routines";

import Toaster from "./listener";

export default function Home(): React.ReactNode {
  return (
    <main>
      <Toaster />
      <RoutineList title="Dailies" />
    </main>
  );
}
