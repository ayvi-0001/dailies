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
}: {
  routine: Routine;
}): React.ReactNode {
  const RoutineActions = (): React.ReactElement => {
    return (
      <div className="flex flex-wrap items-center md:flex-row gap-4">
        <EditDialog routine={routine} />
        <HistoryDrawer routine={routine} />
      </div>
    );
  };

  const [inputValue, setInputValue] = useState<number | null>(routine.value);

  return (
    <CardBorder>
      <GroupLabel routine={routine} />
      <div className="absolute top-0 left-0 ml-16">
        <Header title={routine.name}>
          <div className="ml-5 mt-1">
            <RoutineActions />
          </div>
        </Header>
      </div>
      <div className="absolute bottom-0 left-0 ml-16 mb-2">
        <Details routine={routine} />
      </div>
      <div className="absolute inset-x-60 top-0 ml-50 m-5 w-5/10">
        <Notes notes={routine.notes ?? ""} />
      </div>
      <div className="absolute bottom-0 right-0 mr-6 mb-4">
        <ValueInput
          routine={routine}
          inputValue={inputValue}
          setInputValueAction={setInputValue}
        />
      </div>
      <div className="absolute top-0 right-0 mr-6 mt-4">
        <WeightsLabel
          routine={routine}
          inputValue={inputValue}
          setInputValueAction={setInputValue}
        />
      </div>
    </CardBorder>
  );
}
