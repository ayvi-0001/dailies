import React from "react";

import { Separator } from "@/components/ui/separator";

import type { Section } from "@/types/routines";

export default function SectionHeader(section: Section): React.ReactNode {
  return (
    <div className="relative z-5 h-11 bg-[#6B6C76] opacity-90 bg-blend-overlay select-none">
      <div className="flex flex-row items-center gap-3">
        <div className="box-content aspect-square size-11 bg-yellow-400 shadow-md"></div>
        <div>
          <p className="text-3xl font-bold text-black text-shadow-sm">{section.title}</p>
        </div>
        <div className="absolute right-0 mr-4 flex flex-row text-lg">
          <p className="font-bold">total weight</p>
          <div className="space-x-2 py-1">
            <Separator
              orientation="vertical"
              decorative
              className="mr-3 ml-3 border-1 border-black"
            />
          </div>
          <p className="align-middle font-bold underline decoration-amber-600/70 decoration-2 underline-offset-6">
            {/* TODO(ayvi): recalculate total weight on update http://ayvi:3000/ayvi/dailies/issues/37 */}
            {section.totalWeight}
          </p>
        </div>
      </div>
    </div>
  );
}
