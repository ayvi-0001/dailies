"use client";

import * as React from "react";

import { User, useState as useUserState } from "@/app/providers/user";
import DailiesHeatmap from "@/components/stats/dailies-heatmap";
import DailiesLineChart from "@/components/stats/dailies-line-chart";

export default function App(): React.ReactElement {
  const user: User = useUserState().user!;

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="h-80 w-screen">{<DailiesHeatmap user={user} />}</div>
      <div className="max-h-20 w-full grow" />
      <div className="h-80 w-screen">{<DailiesLineChart user={user} />}</div>
    </div>
  );
}
