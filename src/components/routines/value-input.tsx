"use client";

import * as React from "react";

import { invoke } from "@tauri-apps/api/core";
import { type ClassValue, clsx } from "clsx";
import { TextCursorInput } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CursorTracker from "@/components/animata/container/cursor-tracker";
import Input from "@/components/ui/input";

import type { Routine } from "./types";

export default function ValueInput({
  routine,
  inputValue,
  setInputValueAction,
  onRefreshAction,
}: {
  routine: Routine;
  inputValue: string | null;
  setInputValueAction: React.Dispatch<React.SetStateAction<string | null>>;
  onRefreshAction: () => void;
}): React.ReactNode {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [cancelInput, setCancelInput] = React.useState<boolean>(false);
  const [restoreInputValue, setRestoreInputValue] = React.useState<string | null>(inputValue);

  const handleOnChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    // set max length to 6 characters
    event.currentTarget.value = event.currentTarget.value.slice(0, 6);
    setInputValueAction(event.target.value);
  };

  const handleOuterDivClick = async (
    _: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ): Promise<void> => {
    inputRef?.current?.select();
  };

  const handleOnBlurCapture = async (event: React.FocusEvent<HTMLInputElement>): Promise<void> => {
    if (cancelInput == true) {
      setCancelInput(false);
      setInputValueAction(restoreInputValue);
      event.stopPropagation();
    }
  };

  const handleOnBlur = async (_: React.FocusEvent<HTMLInputElement>): Promise<void> => {
    if (inputValue != restoreInputValue) {
      let value: number | undefined;
      try {
        value = +`${inputValue}`;
        if (!Number.isNaN(value)) {
          setInputValueAction(value.toString());
          setRestoreInputValue(value.toString());
          routine.value = value;
          onRefreshAction();
          await invoke<Routine[]>("handle_value_change", { routine: routine });
        } else {
          toast.error("Invalid value", { description: `${inputValue} not a valid numeric value.` });
        }
      } catch {}
    }
  };

  const handleOnKeyDownCapture = async (event: React.KeyboardEvent) => {
    // will blur onKeyDown
    ["Escape"].includes(event.key) && setCancelInput(true);
  };

  const handleOnKeyDown = async (event: React.KeyboardEvent) => {
    if (["Backspace", "Delete"].includes(event.key) && event.ctrlKey) {
      setInputValueAction(null);
      setRestoreInputValue(null);
      routine.value = null;
      await invoke<Routine[]>("handle_value_change", { routine: routine });
    } else if (["Escape", "Enter"].includes(event.key)) {
      inputRef?.current?.blur();
    }
  };

  let borderClasses: ClassValue = cn(
    "rounded-full border-3 border-dashed",
    "border-transparent",
    clsx(
      +`${inputValue}` >= routine.maxValue && "border-green-700",
      +`${inputValue}` < routine.maxValue && "border-blue-700",
      +`${inputValue}` === 0 && "border-red-700",
      +`${inputValue}` && " outline-2 outline-offset-2 outline-dashed",
    ),
  );

  let textClasses: ClassValue = cn(
    "text-transparent",
    clsx(
      +`${inputValue}` >= routine.maxValue && "text-green-700",
      +`${inputValue}` < routine.maxValue && "text-blue-700",
      +`${inputValue}` === 0 && "text-red-700",
      +`${inputValue}` && "text-lg font-semibold ",
    ),
  );

  return (
    <CursorTracker>
      <TextCursorInput />
      <div className={cn(borderClasses, "select-none")} onClick={handleOuterDivClick}>
        <div className="mt-1 mr-15 mb-1 ml-15 flex items-center lg:mr-30 lg:ml-30">
          <Input
            id={routine.valueId}
            value={`${inputValue}`}
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
              "relative flex field-sizing-content justify-self-end",
              "text-right text-lg shadow-xs",
              "border-y border-r border-none first:rounded-l-md first:border-l",
              `dark:bg-input/30 dark: transition-all outline-none has-disabled:opacity-50`,
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
          <p className={textClasses}>{routine.maxValue}</p>
        </div>
      </div>
    </CursorTracker>
  );
}
