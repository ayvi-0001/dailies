"use client";

import * as React from "react";

import { NoteStack } from "@/components/svgs";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import type { Routine } from "@/types/routines";

import CardBorder from "./border";
import Details from "./details";
import EditDialog from "./edit-dialog";
import GroupLabel from "./group-label";
import Header from "./header";
import HistoryDrawer from "./history-drawer";
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

  const [windowWidth, setWindowWidth] = React.useState<number>(0);
  const [inputValue, setInputValue] = React.useState<number | null>(
    routine.value,
  );

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
                <div className="ml-6">
                  <RoutineActions />
                </div>
              </Header>
              <div className="mt-4">
                <Details routine={routine} />
              </div>
            </div>
          </div>
        </div>
        <div className="py-3 ml-7 mr-7 grow items-center justify-self-center">
          {windowWidth >= 700 ? (
            <div>
              <p className="text-black overflow-hidden text-ellipsis line-clamp-5">
                {routine.notes ?? ""}
              </p>
            </div>
          ) : (
            <div>
              {routine.notes && (
                <HoverCard>
                  <HoverCardTrigger>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-none"
                    >
                      <NoteStack fill="#000000" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="bg-black/70">
                    <p className="text-sm text-white">{routine.notes ?? ""}</p>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          )}
        </div>
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
