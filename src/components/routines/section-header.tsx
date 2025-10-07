import React from "react";

import { Separator } from "@/components/ui/separator";

import type { Section } from "@/types/routines";

export default function SectionHeader(section: Section): React.ReactNode {
  return (
    <div className="select-none h-11 bg-[#6B6C76] z-5 relative opacity-90 bg-blend-overlay">
      <div className="flex flex-row gap-3 items-center">
        <div className="bg-yellow-400 box-content size-11 aspect-square shadow-md"></div>
        <div>
          <p className="font-bold text-black text-3xl text-shadow-sm">{section.title}</p>
        </div>
        <div className="absolute right-0 mr-4 flex flex-row text-lg">
          <p className="font-bold">total weight</p>
          <div className="py-1 space-x-2">
            <Separator
              orientation="vertical"
              decorative
              className="border-black border-1 mr-3 ml-3"
            />
          </div>
          <p className="align-middle font-bold decoration-2 underline-offset-6 underline decoration-amber-600/70">
            {/* TODO(ayvi): recalculate total weight on update http://ayvi:3000/ayvi/dailies/issues/37 */}
            {section.totalWeight}
          </p>
        </div>
      </div>
    </div>
  );
}
