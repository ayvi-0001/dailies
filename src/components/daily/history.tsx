import * as React from "react";

import { ScrollShadow } from "@heroui/react";
import { ok } from "assert";

import * as User from "@/app/providers/user";
import { cachedQueryDailyHistory } from "@/actions/query";
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
import type { Option } from "@/types/option";

import getAccentClasses from "./accents";
import CardBorder from "./border";
import QuestChainLabel from "./chain";
import Details from "./details";
import EditDailyDialog from "./dialogs/edit";
import PointsInput from "./input";
import NameLabel from "./name";
import PointsDisplay from "./points";
import type { Daily } from "./types";

// TODO(ayvi): history days options/streaming http://ayvi:3000/ayvi/dailies/issues/32
// TODO(ayvi): move to generic drawer component

export default function HistoryDrawer({
  daily,
  // TODO(ayvi): totalWeight for history should eval for the respective day
  // http://ayvi:3000/ayvi/dailies/issues/35
  totalWeight,
}: {
  daily: Daily;
  totalWeight: number;
}): React.ReactElement {
  const [openHistory, setOpenHistory] = React.useState<boolean>(false);

  const userState: User.UserState = User.useState();
  const userName: Option<string> = userState?.user?.name || null;
  ok(userName, Error("Cannot query history when user is unknown."));

  return (
    <Drawer open={openHistory} onOpenChange={setOpenHistory}>
      <DrawerTrigger asChild>
        <Button variant="default" size="sm">
          <ManageHistory />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="border-1 border-white bg-black/80">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-white">{daily.name}</DrawerTitle>
          {<DrawerDescription className="text-white"></DrawerDescription>}
          <div>
            {openHistory && (
              <HistoryCards
                daily={cachedQueryDailyHistory(userName, daily.questId, 6)}
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
  daily,
  totalWeight,
}: {
  daily: Promise<Daily[]>;
  totalWeight: number;
}): React.ReactElement {
  return (
    <ScrollShadow
      offset={80}
      size={10}
      hideScrollBar
      className="h-[32rem] overflow-y-auto rounded-md"
      style={{ scrollbarWidth: "none" }}
    >
      <React.Suspense fallback={<div>Loading...</div>}>
        {React.use(daily).map((daily: Daily, index: number) => (
          <div key={`${daily.pointId}-${index}`} className="m-4">
            {HistoryDailyCard(daily, index, totalWeight)}
          </div>
        ))}
      </React.Suspense>
    </ScrollShadow>
  );
}

const HistoryDailyCard = (daily: Daily, index: number, totalWeight: number) => {
  const [points, setPoints] = React.useState<Option<string>>(`${daily.points}`);

  const { bgColor, borderColor } = getAccentClasses(daily.chain);

  return (
    <CardBorder key={`${daily.pointId}-${index}`} className={borderColor}>
      <div
        key={`${daily.pointId}-${index}`}
        className="flex flex-row self-center"
        style={{ height: 150 } as React.CSSProperties}
      >
        <div className="flex flex-none items-center">
          <QuestChainLabel daily={daily} borderColor={borderColor} bgColor={bgColor} />
          <div className="flex flex-col">
            <div className="ml-4">
              <NameLabel title={daily.date.toString()}>
                <div className="mt-1 ml-6">
                  <div className="flex flex-wrap items-center gap-4 md:flex-row">
                    <EditDailyDialog
                      title={`${daily.name} (${daily.date})`}
                      daily={daily}
                      onRefreshAction={() => {}}
                    />
                  </div>
                </div>
              </NameLabel>
              <div className="mt-4">
                <Details daily={daily} />
              </div>
            </div>
          </div>
        </div>
        <div className="mr-7 ml-7 grow items-center justify-self-center py-6">{/* Notes */}</div>
        <div className="flex flex-none items-center justify-self-center">
          <div>
            <div className="mb-2 justify-self-end">
              <PointsDisplay daily={daily} points={points} totalWeight={totalWeight} />
            </div>
            <PointsInput
              daily={daily}
              points={points}
              setPointsAction={setPoints}
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
