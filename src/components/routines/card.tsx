"use client";

import React from "react";
import { useState } from "react";

import type { Routine } from "@/types/routines";

import CardBorder from "./border";
import Details from "./details";
import EditDialog from "./edit-dialog";
import GroupLabel from "./group-label";
import Header from "./header";
import HistoryDrawer from "./history-drawer";
import Notes from "./notes";
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
  const RoutineActions = (): React.ReactElement => {
    return (
      <div className="flex flex-wrap items-center md:flex-row gap-4">
        <EditDialog
          title={routine.name}
          routine={routine}
          onRefreshAction={onRefreshAction}
        />
        <HistoryDrawer routine={routine} totalWeight={totalWeight} />
      </div>
    );
  };

  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [inputValue, setInputValue] = useState<number | null>(routine.value);

  React.useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <CardBorder>
      <div
        className="flex flex-row self-center"
        style={{ height: 150 } as React.CSSProperties}
      >
        <div className="flex flex-none items-center">
          <GroupLabel routine={routine} />
          <div className="flex flex-col">
            <div className="ml-4">
              <Header title={routine.name}>
                <div className="ml-6 mt-1">
                  <RoutineActions />
                </div>
              </Header>
              <div className="mt-4">
                <Details routine={routine} />
              </div>
            </div>
          </div>
        </div>
        {windowWidth >= 1200 ? (
          <div className="py-4 ml-7 mr-7 grow items-center justify-self-center">
            <Notes notes={routine.notes ?? ""} />
          </div>
        ) : (
          <div className="grow items-center justify-self-center"></div>
        )}
        <div className="flex flex-none items-center justify-self-center">
          <div>
            <div className="justify-self-end">
              <WeightsLabel
                routine={routine}
                inputValue={inputValue}
                totalWeight={totalWeight}
              />
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
