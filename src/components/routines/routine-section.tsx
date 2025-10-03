import React from "react";

import type { Section } from "../../types/routines";

export default function RoutineSection({ title }: Section): React.ReactNode {
  return (
    <div className="select-none w-auto h-10 m-5 bg-[#6B6C76] z-5 relative opacity-90 bg-blend-overlay">
      <div className="bg-yellow-400 box-content size-10 aspect-square shadow-md">
        <p className="ml-15 font-bold text-black text-3xl text-shadow-sm">
          {title}
        </p>
      </div>
    </div>
  );
}
