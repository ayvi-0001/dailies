"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { Option } from "@/types/option";

import getAccentClasses from "./actions/accents";
import CardBorder from "./border";
import QuestChainLabel from "./chain";
import Details from "./details";
import EditDailyDialog from "./dialogs/edit";
import HistoryDrawer from "./history";
import PointsInput from "./input";
import NameLabel from "./name";
import Notes from "./notes";
import PointsDisplay from "./points";
import type { Daily } from "./types";

export default function DailyCard({
  daily,
  totalWeight,
  windowWidth,
  onRefreshAction,
}: {
  daily: Daily;
  totalWeight: number;
  windowWidth: number;
  onRefreshAction: () => void;
}): React.ReactNode {
  const [points, setPoints] = React.useState<Option<string>>(`${daily.points}`);

  const { bgColor, borderColor } = getAccentClasses(daily.chain);

  return (
    <CardBorder className={cn(borderColor, "z-1")}>
      <div className="flex flex-row self-center" style={{ height: 150 } as React.CSSProperties}>
        <div className="flex flex-none items-center">
          <QuestChainLabel daily={daily} borderColor={borderColor} bgColor={bgColor} />
          <div className="flex flex-col">
            <div className="ml-4">
              <NameLabel title={daily.name}>
                <div className="ml-6">
                  <div className="mt-2 ml-3 flex flex-wrap items-center gap-4 md:flex-row">
                    <EditDailyDialog
                      title={daily.name}
                      daily={daily}
                      onRefreshAction={onRefreshAction}
                    />
                    <HistoryDrawer daily={daily} totalWeight={totalWeight} />
                  </div>
                </div>
              </NameLabel>
              <div className="mt-3">
                <Details daily={daily} />
              </div>
            </div>
          </div>
        </div>
        <div className="mr-7 ml-7 grow items-center justify-self-center py-6">
          <Notes title={daily.note} windowWidth={windowWidth} />
        </div>
        <div className="flex flex-none items-center">
          <div>
            <div className="mb-2 justify-self-end">
              <PointsDisplay daily={daily} points={points} totalWeight={totalWeight} />
            </div>
            <PointsInput
              daily={daily}
              points={points}
              setPointsAction={setPoints}
              onRefreshAction={onRefreshAction}
            />
          </div>
        </div>
      </div>
    </CardBorder>
  );
}
