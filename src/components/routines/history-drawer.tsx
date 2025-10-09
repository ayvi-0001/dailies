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

import type { Option } from "@/types/option";

import getAccentClasses from "./accents";
import CardBorder from "./border";
import Details from "./details";
import EditDialog from "./edit-dialog";
import GroupLabel from "./group-label";
import Header from "./header";
import type { Routine } from "./types";
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
      <DrawerContent className="border-1 border-white bg-black/80">
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
      className="h-[32rem] overflow-y-auto rounded-md [scrollbarWidth:none]"
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
  const [inputValue, setInputValue] = React.useState<Option<string>>(`${routine.value}`);

  let { bgColor, borderColor } = getAccentClasses(routine.group);

  return (
    <CardBorder key={`${routine.valueId}-${index}`} className={borderColor}>
      <div
        key={`${routine.valueId}-${index}`}
        className="flex flex-row self-center"
        style={{ height: 150 } as React.CSSProperties}
      >
        <div className="flex flex-none items-center">
          <GroupLabel routine={routine} borderColor={borderColor} bgColor={bgColor} />
          <div className="flex flex-col">
            <div className="ml-4">
              <Header title={routine.date.toString()}>
                <div className="mt-1 ml-6">
                  <div className="flex flex-wrap items-center gap-4 md:flex-row">
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
        <div className="mr-7 ml-7 grow items-center justify-self-center py-6">{/* Notes */}</div>
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
