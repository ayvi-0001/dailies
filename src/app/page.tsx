import Toaster from "@/app/listener";
import React from "react";

import { RoutineList } from "@/components/routines";

export default function Home(): React.ReactNode {
  return (
    <main>
      <Toaster />
      <RoutineList title="Open" />
    </main>
  );
}
