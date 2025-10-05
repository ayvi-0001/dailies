"use client";

import React from "react";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Routine } from "@/types/routines";

import queryRoutineHistory from "./utils";

// TODO(ayvi): move to generic drawer component
export default function HistoryDrawer({
  routine,
}: {
  routine: Routine;
}): React.ReactElement {
  const [openHistory, setOpenHistory] = React.useState<boolean>(false);

  // TODO(ayvi): history days options/streaming http://ayvi:3000/ayvi/dailies/issues/32

  return (
    <Drawer open={openHistory} onOpenChange={setOpenHistory}>
      {/* TODO(ayvi): editable history http://ayvi:3000/ayvi/dailies/issues/14 */}
      <DrawerTrigger asChild>
        <Button variant="default" size="sm">
          history
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-black border-white border-1">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-white">{routine.name}</DrawerTitle>
          <DrawerDescription className="text-white">
            {"< TODO >"}
          </DrawerDescription>
          <div>
            {openHistory && (
              <HistoryCards
                routines={queryRoutineHistory(routine.routineId, 6)}
              />
            )}
          </div>
        </DrawerHeader>
        <div className="px-4"></div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline" size="sm">
              close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function HistoryCards({
  routines,
}: {
  routines: Promise<Routine[]>;
}): React.ReactElement {
  const allRoutines = React.use(routines);

  return (
    <ScrollArea className="h-[32rem] rounded-md">
      <Suspense fallback={<div>Loading...</div>}>
        {allRoutines.map((value: Routine, index: number) => (
          <div
            key={index}
            className="select-none box-content border-yellow-400/80 m-5 py-1 isolate bg-white/78 shadow-lg ring-1 ring-black/5 relative size-auto transition-all duration-300 ease-in-out hover:border-yellow/40 hover:translate-y-[-1px] hover:shadow-lg border-4"
            style={{ height: 150 } as React.CSSProperties}
          >
            <div key={index}>{JSON.stringify(value, null, 2)}</div>
          </div>
        ))}
      </Suspense>
    </ScrollArea>
  );
}
