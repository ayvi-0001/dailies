"use client";

import * as React from "react";

import { ClassValue } from "clsx";

import DailiesHeatmap from "@/components/stats/dailies-heatmap";
import DailiesLineChart from "@/components/stats/dailies-line-chart";

export default function App(): React.ReactElement {
  const backgroundClass: ClassValue = "bg-black/30";
  const outlineClass: ClassValue = "outline-5 outline-black/30";

  return (
    <div className="scrollbar-hide flex h-full flex-col items-center gap-4 overflow-x-auto whitespace-nowrap">
      <span className="items-start self-center text-xs text-[#f0f0ff]/60 italic underline underline-offset-6">
        This feature is still under construction
      </span>
      <div className="flex h-full flex-col gap-5">
        <div className="w-screen">
          <DailiesHeatmap classNames={{ bg: backgroundClass, outline: outlineClass }} />
        </div>
        <div className="w-screen">
          <DailiesLineChart classNames={{ bg: backgroundClass, outline: outlineClass }} />
        </div>
      </div>
    </div>
  );
}

export type VisualsClassNames = {
  bg?: string;
  outline?: string;
};
