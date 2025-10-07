import * as React from "react";

import { ManageHistory } from "@/components/svgs";
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

import CardBorder from "./border";
import Details from "./details";
import EditDialog from "./edit-dialog";
import GroupLabel from "./group-label";
import Header from "./header";
import { cachedQueryRoutineHistory } from "./utils";
import ValueInput from "./value-input";
import WeightsLabel from "./weights-label";

// TODO(ayvi): history days options/streaming http://ayvi:3000/ayvi/dailies/issues/32
// TODO(ayvi): move to generic drawer component

export default function HistoryDrawer({
  routine,
  // TODO(ayvi): totalWeight for history should eval for the respective day
  // http://ayvi:3000/ayvi/dailies/issues/35
  totalWeight,
}: {
  routine: Routine;
  totalWeight: number;
}): React.ReactElement {
  const [openHistory, setOpenHistory] = React.useState<boolean>(false);

  return (
    <Drawer open={openHistory} onOpenChange={setOpenHistory}>
      <DrawerTrigger asChild>
        <Button variant="default" size="sm">
          <ManageHistory />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-black/80 border-white border-1">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-white">{routine.name}</DrawerTitle>
          {<DrawerDescription className="text-white"></DrawerDescription>}
          <div>
            {openHistory && (
              <HistoryCards
                routines={cachedQueryRoutineHistory(routine.routineId, 6)}
                totalWeight={totalWeight}
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

// TODO(ayvi): infinite scroll history http://ayvi:3000/ayvi/dailies/issues/33
function HistoryCards({
  routines,
  totalWeight,
}: {
  routines: Promise<Routine[]>;
  totalWeight: number;
}): React.ReactElement {
  return (
    <ScrollArea
      className="h-[32rem] rounded-md overflow-y-auto [scrollbarWidth:none]"
      style={{ scrollbarWidth: "none" }}
    >
      <React.Suspense fallback={<div>Loading...</div>}>
        {React.use(routines).map((routine: Routine, index: number) => (
          <div key={`${routine.valueId}-${index}`} className="m-4">
            {HistoryRoutineCard(routine, index, totalWeight)}
          </div>
        ))}
      </React.Suspense>
    </ScrollArea>
  );
}

const HistoryRoutineCard = (routine: Routine, index: number, totalWeight: number) => {
  const [inputValue, setInputValue] = React.useState<number | null>(routine.value);

  return (
    <CardBorder key={`${routine.valueId}-${index}`}>
      <div
        key={`${routine.valueId}-${index}`}
        className="flex flex-row self-center"
        style={{ height: 150 } as React.CSSProperties}
      >
        <div className="flex flex-none items-center">
          <GroupLabel routine={routine} />
          <div className="flex flex-col">
            <div className="ml-4">
              <Header title={routine.date.toString()}>
                <div className="ml-6 mt-1">
                  <div className="flex flex-wrap items-center md:flex-row gap-4">
                    <EditDialog
                      title={`${routine.name} (${routine.date})`}
                      routine={routine}
                      onRefreshAction={() => {}}
                    />
                  </div>
                </div>
              </Header>
              <div className="mt-4">
                <Details routine={routine} />
              </div>
            </div>
          </div>
        </div>
        <div className="grow items-center justify-self-center"></div>
        <div className="flex flex-none items-center justify-self-center">
          <div>
            <div className="justify-self-end">
              <WeightsLabel routine={routine} inputValue={inputValue} totalWeight={totalWeight} />
            </div>
            <ValueInput
              routine={routine}
              inputValue={inputValue}
              setInputValueAction={setInputValue}
              // TODO(ayvi): onRefreshAction for history cards should refresh historic data,
              // not dailies in current day view http://ayvi:3000/ayvi/dailies/issues/36
              onRefreshAction={() => {}}
            />
          </div>
        </div>
      </div>
    </CardBorder>
  );
};
