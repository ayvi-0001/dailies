import React from "react";

import { RoutineList } from "@/components/routines";

export default function Home(): React.ReactNode {
  return (
    <main>
      <RoutineList title="Open" />
    </main>
  );
}
