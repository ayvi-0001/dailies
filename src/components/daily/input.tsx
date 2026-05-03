"use client";

import * as React from "react";

import { type ClassValue, clsx } from "clsx";
import { TextCursorInput } from "lucide-react";

import { AppMetaState, useAppMetaState } from "@/app/providers/app-meta";
import CursorTracker from "@/components/animata/container/cursor-tracker";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/option";

import { NumpadInputCell } from "./numpad";
import type { Daily } from "./types";

type PointsInputProps = {
  daily: Daily;
  disabled?: boolean;
  points: Option<string>;
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>;
  updateDailyAction: (pointId: string, patch: Partial<Daily>) => void;
};

export default function PointsInput(props: PointsInputProps): React.ReactNode {
  const { daily, disabled, points, setPointsAction, updateDailyAction } = props;

  const appMeta: AppMetaState = useAppMetaState();

  const borderClassValue: ClassValue = cn(
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "rounded-full border-1 border-solid",
    "border-transparent",
    clsx(
      +`${points}` >= daily.total && "border-green-700",
      +`${points}` < daily.total && "border-blue-700",
      +`${points}` == 0 && "border-red-700",
      +`${points}` >= 0 && "outline-1 outline-offset-1 outline-solid",
    ),
  );

  const textClassValue: ClassValue = cn(
    "text-xs font-semibold shadow-xs",
    "text-transparent",
    clsx(
      +`${points}` >= daily.total && "text-green-700",
      +`${points}` < daily.total && "text-blue-700",
      +`${points}` === 0 && "text-red-700",
    ),
  );

  switch (appMeta.platform) {
    case "android":
      return (
        <NumpadInputCell
          borderClassValue={borderClassValue}
          daily={daily}
          disabled={disabled}
          points={points}
          setPointsAction={setPointsAction}
          textClassValue={textClassValue}
          updateDailyAction={updateDailyAction}
        />
      );
    default:
      return (
        <CursorTracker platform={appMeta.platform}>
          <TextCursorInput />
          <NumpadInputCell
            borderClassValue={borderClassValue}
            daily={daily}
            disabled={disabled}
            points={points}
            setPointsAction={setPointsAction}
            textClassValue={textClassValue}
            updateDailyAction={updateDailyAction}
          />
        </CursorTracker>
      );
  }
}
