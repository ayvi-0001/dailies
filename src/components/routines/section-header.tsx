import React from "react";

import { Separator } from "@/components/ui/separator";

import type { Section } from "@/types/routines";

export default function SectionHeader(section: Section): React.ReactNode {
  let height: number = 11;

  return (
    <div
      className={`select-none w-auto h-${height} m-5 bg-[#6B6C76] z-5 relative opacity-90 bg-blend-overlay`}
    >
      <div className="flex flec-col">
        <div
          className={`bg-yellow-400 box-content size-${height} aspect-square shadow-md`}
        >
          <p className="ml-15 font-bold text-black text-3xl text-shadow-sm mt-1">
            {section.title}
          </p>
        </div>
        <div className="absolute right-0 mr-4 mt-2 flex flex-row">
          <p className="align-middle text-xl font-bold">total weight</p>
          <div className="flex h-5 items-center space-x-4">
            <Separator
              orientation="vertical"
              decorative
              className="border-black border-1 mt-2 mr-3 ml-3"
            />
          </div>
          <p className="align-middle text-xl font-bold decoration-2 underline-offset-6 underline decoration-amber-600/70 ">
            {/* TODO(ayvi): recalculate total weight on update http://ayvi:3000/ayvi/dailies/issues/37 */}
            {section.totalWeight}
          </p>
        </div>
      </div>
    </div>
  );
}
