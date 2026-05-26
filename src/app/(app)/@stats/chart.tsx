"use client";

import * as React from "react";

import DailiesHeatmap from "@/components/stats/dailies-heatmap";
import DailiesLineChart from "@/components/stats/dailies-line-chart";

export default function App(): React.ReactElement {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="h-80 w-screen">{<DailiesHeatmap />}</div>
      <div className="max-h-20 w-full grow" />
      <div className="h-80 w-screen">{<DailiesLineChart />}</div>
    </div>
  );
}
