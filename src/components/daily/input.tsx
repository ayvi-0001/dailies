"use client";

import * as React from "react";

import { invoke } from "@tauri-apps/api/core";
import { type ClassValue, clsx } from "clsx";
import { TextCursorInput } from "lucide-react";
import { toast } from "sonner";

import CursorTracker from "@/components/animata/container/cursor-tracker";
import Input from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/option";

import type { Daily } from "./types";

export default function PointsInput({
  daily,
  points,
  setPointsAction,
  onRefreshAction,
}: {
  daily: Daily;
  points: Option<string>;
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>;
  onRefreshAction: () => void;
}): React.ReactNode {
  const inputRef = React.useRef<Option<HTMLInputElement>>(null);

  const [cancelInput, setCancelInput] = React.useState<boolean>(false);
  const [restorePoints, setRestorePoints] = React.useState<Option<string>>(points);

  const handleOnChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    // set max length to 6 characters
    event.currentTarget.value = event.currentTarget.value.slice(0, 6);
    setPointsAction(event.target.value);
  };

  const handleOuterDivClick = async (
    _: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ): Promise<void> => {
    inputRef?.current?.select();
  };

  const handleOnBlurCapture = async (event: React.FocusEvent<HTMLInputElement>): Promise<void> => {
    if (cancelInput) {
      setCancelInput(false);
      setPointsAction(restorePoints);
      event.stopPropagation();
    }
  };

  const handleOnBlur = async (_: React.FocusEvent<HTMLInputElement>): Promise<void> => {
    if (points != restorePoints) {
      try {
        const pointsEval = +`${points}`;
        if (!Number.isNaN(pointsEval)) {
          setPointsAction(pointsEval.toString());
          setRestorePoints(pointsEval.toString());
          daily.points = pointsEval;
          onRefreshAction();
          await invoke<Daily[]>("handle_point_change", { daily: daily });
        } else {
          toast.error("Invalid value", { description: `${points} not a valid numeric value.` });
        }
      } catch {
        /* empty */
      }
    }
  };

  const handleOnKeyDownCapture = async (event: React.KeyboardEvent): Promise<void> => {
    // will blur onKeyDown
    if (["Escape"].includes(event.key)) {
      setCancelInput(true);
    }
  };

  const handleOnKeyDown = async (event: React.KeyboardEvent) => {
    if (["Backspace", "Delete"].includes(event.key) && event.ctrlKey) {
      setPointsAction(null);
      setRestorePoints(null);
      daily.points = null;
      await invoke<Daily[]>("handle_point_change", { daily: daily });
    } else if (["Escape", "Enter"].includes(event.key)) {
      inputRef?.current?.blur();
    }
  };

  const borderClasses: ClassValue = cn(
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "rounded-full border-3 border-dashed",
    "border-transparent",
    clsx(
      +`${points}` >= daily.total && "border-green-700",
      +`${points}` < daily.total && "border-blue-700",
      +`${points}` == 0 && "border-red-700",
      +`${points}` >= 0 && "outline-2 outline-offset-2 outline-dashed",
    ),
  );

  const textClasses: ClassValue = cn(
    "text-xl font-semibold shadow-xs",
    "text-transparent",
    clsx(
      +`${points}` >= daily.total && "text-green-700",
      +`${points}` < daily.total && "text-blue-700",
      +`${points}` === 0 && "text-red-700",
    ),
  );

  return (
    <CursorTracker>
      <TextCursorInput />
      <div
        className={cn(
          borderClasses,
          "hover:outline-2 hover:outline-offset-2 hover:outline-dashed",
          "select-none",
          "max-w-[20rem] min-w-[20rem] lg:max-w-[25rem] lg:min-w-[25rem]",
        )}
        onClick={handleOuterDivClick}
      >
        <div className="mt-1 mb-1 flex place-content-center items-center justify-self-center-safe">
          <Input
            id={daily.pointId}
            value={`${points ?? ""}`}
            ref={inputRef}
            type="number"
            inputMode="numeric"
            multiple
            pattern="\d*\.?\d*"
            onChange={handleOnChange}
            onKeyDownCapture={handleOnKeyDownCapture}
            onKeyDown={handleOnKeyDown}
            onBlurCapture={handleOnBlurCapture}
            onBlur={handleOnBlur}
            autoComplete="off"
            height={1}
            className={cn(
              textClasses,
              "field-sizing-content",
              "border-y border-r border-none",
              `dark:bg-input/30 has-disabled:opacity-50 dark:transition-all`,
              "data-[active=true]:border-ring",
              "data-[active=true]:ring-ring/50",
              "data-[active=true]:aria-invalid:ring-destructive/20",
              "data-[active=true]:aria-invalid:border-destructive",
              "data-[active=true]:aria-invalid:ring-destructive/40",
              "data-[active=true]:z-10",
              "data-[active=true]:ring-[3px]",
              "aria-invalid:border-destructive",
            )}
          />
          <div className="mr-4 ml-4">
            <p className={textClasses}>/</p>
          </div>
          <p className={textClasses}>{daily.total}</p>
        </div>
      </div>
    </CursorTracker>
  );
}
