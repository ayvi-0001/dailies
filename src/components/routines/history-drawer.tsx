import * as React from "react";

import { ManageHistory } from "@/components/svgs";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Routine } from "@/types/routines";

import CardBorder from "./border";
import Details from "./details";
import GroupLabel from "./group-label";
import Header from "./header";
import { cachedQueryRoutineHistory } from "./utils";
import ValueInput from "./value-input";
import WeightsLabel from "./weights-label";

// TODO(ayvi): history days options/streaming http://ayvi:3000/ayvi/dailies/issues/32
// TODO(ayvi): move to generic drawer component

export default function HistoryDrawer({
  routine,
}: {
  routine: Routine;
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
          {/*<DrawerDescription className="text-white"></DrawerDescription>*/}
          <div>
            {openHistory && (
              <HistoryCards
                routines={cachedQueryRoutineHistory(routine.routineId, 6)}
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
}: {
  routines: Promise<Routine[]>;
}): React.ReactElement {
  return (
    <ScrollArea className="h-[32rem] rounded-md">
      <React.Suspense fallback={<div>Loading...</div>}>
        {React.use(routines).map((routine: Routine, index: number) =>
          HistoryRoutineCard(routine, index),
        )}
      </React.Suspense>
    </ScrollArea>
  );
}

const HistoryRoutineCard = (routine: Routine, index: number) => {
  const [inputValue, setInputValue] = React.useState<number | null>(
    routine.value,
  );

  return (
    <CardBorder key={index}>
      <GroupLabel key={index} routine={routine} />
      <div className="absolute top-0 left-0 ml-16">
        <Header key={index} title={routine.date.toString()} />
      </div>
      <div className="absolute bottom-0 left-0 ml-16 mb-2">
        <Details key={index} routine={routine} />
      </div>
      <div className="absolute bottom-0 right-0 mr-6 mb-4">
        <ValueInput
          key={index}
          routine={routine}
          inputValue={inputValue}
          // TODO(ayvi): onRefreshAction for history cards should refresh historic data,
          // not dailies in current day view http://ayvi:3000/ayvi/dailies/issues/36
          onRefreshAction={() => {}}
          setInputValueAction={setInputValue}
        />
      </div>
      <div className="absolute top-0 right-0 mr-6 mt-4">
        <WeightsLabel
          key={index}
          routine={routine}
          inputValue={inputValue}
          setInputValueAction={setInputValue}
        />
      </div>
    </CardBorder>
  );
};
