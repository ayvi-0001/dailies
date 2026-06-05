"use client";

import * as React from "react";

import DailiesHeatmap from "@/components/stats/dailies-heatmap";
import DailiesLineChart from "@/components/stats/dailies-line-chart";

export default function App(): React.ReactElement {
  return (
    <div className="scrollbar-hide flex h-full flex-col items-center overflow-x-auto whitespace-nowrap">
      <span className="mb-4 items-start self-center text-xs text-[#f0f0ff]/60 italic underline underline-offset-6">
        This feature is still under construction
      </span>
      <div className="w-screen">
        <DailiesHeatmap />
      </div>
      <div className="max-h-5 grow" />
      <div className="w-screen">
        <DailiesLineChart />
      </div>
    </div>
  );
}
