"use client";

import React from "react";

import * as WindowSize from "@/app/providers/window-size";
import { Swords } from "lucide-react";

import { roundTo } from "@/lib/number";

import Progress from "@/components/animata/graphs/progress";
import { Separator } from "@/components/ui/separator";

export type Section = {
  title: string;
  weightedTotal: number;
  totalWeight: number;
  countRefreshDailies: number;
};

export default function SectionHeader(section: Section): React.ReactNode {
  let value = roundTo(section.weightedTotal / section.totalWeight, 2);
  value = !Number.isNaN(value) ? value : +``;

  const { windowWidth }: { windowWidth: number } = WindowSize.useWidth();

  return (
    <div className="bg-opacity-70 relative z-5 h-11 bg-[#6B6C76] bg-blend-overlay select-none">
      <div className="flex flex-row gap-6">
        <div className="flex flex-none flex-row gap-3">
          <div className="box-content aspect-square size-11 bg-yellow-400 shadow-md">
            <Swords className="size-11 opacity-20" />
          </div>
          <div className="self-center">
            <p className="text-3xl font-bold text-black text-shadow-sm">{section.title}</p>
          </div>
        </div>
        <div className="flex grow items-center rounded">
          <div className="mr-3 font-normal empty:w-12">
            {value !== 0 && <strong>{value}%</strong>}
          </div>
          <div className="grow">
            <Progress<number>
              progress={value * 100}
              deps={[windowWidth, section.countRefreshDailies]}
            />
          </div>
        </div>
        <div className="mr-4 flex flex-none flex-row items-center text-lg">
          <strong>total weight</strong>
          <div className="h-full py-2">
            <Separator
              orientation="vertical"
              decorative
              className="mr-3 ml-3 border-1 border-black"
            />
          </div>
          <p className="align-middle font-bold">{section.totalWeight}</p>
        </div>
      </div>
    </div>
  );
}
