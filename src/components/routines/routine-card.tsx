import React from "react";

import { Button } from "@/components/ui/button";

export interface Routine {
  name: string;
  group: string;
  type_: string;
  max_value: number;
  value: number;
}

export default function RoutineCard({
  name,
  group,
  type_,
  max_value,
  value,
}: Routine): React.ReactNode {
  return (
    <div
      className="shadow-[0px_20px_207px_10px_rgba(255,_255,_255,_0.2)]"
      style={{
        background: "radial-gradient(circle at top, #1c1c1c, #000000)",
      }}
    >
      <div
        className="border-4 box-content border-yellow-400/80 m-5 py-1 isolate bg-white/78 shadow-lg ring-1 ring-black/5 relative size-auto"
        style={{ height: 150 }}
      >
        <div className="w-8 h-full text-black ml-2 bg-yellow-400 border-yellow-500 border-2">
          <div className="flex justify-center items-center w-full h-full">
            <p className="font-mono font-medium text-xl rotate-180 [writing-mode:vertical-rl]">
              {group}
            </p>
          </div>
          <div className="absolute top-0 left-0 pl-14 flex flex-col">
            <div className="flex flex-row ...">
              <p className="font-bold text-4xl mt-2">{name}</p>
              <div className="md:ml-30 mt-3 flex flex-wrap items-center md:flex-row gap-4">
                <Button variant="default" size="sm">
                  edit
                </Button>
                <Button variant="default" size="sm">
                  history
                </Button>
                <Button variant="default" size="sm">
                  notes
                </Button>
              </div>
            </div>
            <p className="font-bold">type: {type_}</p>
          </div>
          <div className="absolute bottom-0 right-0 mr-10 mb-5 flex flex-col">
            <div className="border-dotted border-4 border-yellow-700 rounded-full">
              <p className="mr-30 ml-30 mt-1 mb-1 text-lg font-semibold">
                {value} / {max_value}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
