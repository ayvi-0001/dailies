"use client";

import * as React from "react";

import type { Option } from "@/types/option";

import getAccentClasses from "./accents";
import CardBorder from "./border";
import Details from "./details";
import EditDialog from "./dialogs/edit";
import GroupLabel from "./group";
import Header from "./name";
import HistoryDrawer from "./history";
import Notes from "./notes";
import type { Routine } from "./types";
import ValueInput from "./input";
import WeightsLabel from "./weights";

export default function RoutineCard({
  routine,
  totalWeight,
  windowWidth,
  onRefreshAction,
}: {
  routine: Routine;
  totalWeight: number;
  windowWidth: number;
  onRefreshAction: () => void;
}): React.ReactNode {
  const [inputValue, setInputValue] = React.useState<Option<string>>(`${routine.value}`);

  const { bgColor, borderColor } = getAccentClasses(routine.group);

  return (
    <CardBorder className={borderColor}>
      <div className="flex flex-row self-center" style={{ height: 150 } as React.CSSProperties}>
        <div className="flex flex-none items-center">
          <GroupLabel routine={routine} borderColor={borderColor} bgColor={bgColor} />
          <div className="flex flex-col">
            <div className="ml-4">
              <Header title={routine.name}>
                <div className="ml-6">
                  <div className="mt-2 ml-3 flex flex-wrap items-center gap-4 md:flex-row">
                    <EditDialog
                      title={routine.name}
                      routine={routine}
                      onRefreshAction={onRefreshAction}
                    />
                    <HistoryDrawer routine={routine} totalWeight={totalWeight} />
                  </div>
                </div>
              </Header>
              <div className="mt-3">
                <Details routine={routine} />
              </div>
            </div>
          </div>
        </div>
        <div className="mr-7 ml-7 grow items-center justify-self-center py-6">
          <Notes title={routine.notes} windowWidth={windowWidth} />
        </div>
        <div className="flex flex-none items-center">
          <div>
            <div className="mb-2 justify-self-end">
              <WeightsLabel routine={routine} inputValue={inputValue} totalWeight={totalWeight} />
            </div>
            <ValueInput
              routine={routine}
              inputValue={inputValue}
              setInputValueAction={setInputValue}
              onRefreshAction={onRefreshAction}
            />
          </div>
        </div>
      </div>
    </CardBorder>
  );
}
