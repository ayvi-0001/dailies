"use client";

import * as React from "react";

import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

import type { TauriWindowResizeEvent } from "@/types/events";
import type { Option } from "@/types/option";

import getAccentClasses from "./accents";
import CardBorder from "./border";
import Details from "./details";
import EditDialog from "./edit-dialog";
import GroupLabel from "./group-label";
import Header from "./header";
import HistoryDrawer from "./history-drawer";
import Notes from "./notes";
import type { Routine } from "./types";
import ValueInput from "./value-input";
import WeightsLabel from "./weights-label";

export default function RoutineCard({
  routine,
  totalWeight,
  onRefreshAction,
}: {
  routine: Routine;
  totalWeight: number;
  onRefreshAction: () => void;
}): React.ReactNode {
  const [windowWidth, setWindowWidth] = React.useState<number>(0);
  const [inputValue, setInputValue] = React.useState<Option<string>>(`${routine.value}`);

  React.useEffect(() => {
    const getInitialWidth = async () => {
      let innerSize = await getCurrentWindow().innerSize();
      setWindowWidth(innerSize.width);
    };

    getInitialWidth();

    const unlisten = listen("tauri://resize", (event: TauriWindowResizeEvent) => {
      console.debug(JSON.stringify(event));
      setWindowWidth(event.payload.width);
    });

    return () => {
      unlisten.then((off: UnlistenFn) => off());
    };
  }, []);

  let { bgColor, borderColor } = getAccentClasses(routine.group);

  return (
    <CardBorder className={borderColor}>
      <div className="flex flex-row self-center" style={{ height: 150 } as React.CSSProperties}>
        <div className="flex flex-none items-center">
          <GroupLabel routine={routine} borderColor={borderColor} bgColor={bgColor} />
          <div className="flex flex-col">
            <div className="ml-4">
              <Header title={routine.name}>
                <div className="ml-6">
                  <div className="flex flex-wrap items-center gap-4 md:flex-row">
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
            <div className="justify-self-end">
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
