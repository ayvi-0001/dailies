"use client";

import React from "react";
import { useRef, useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import clsx from "clsx";
import { TextCursorInput } from "lucide-react";

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
  inputValue: number | null;
  setInputValueAction: React.Dispatch<React.SetStateAction<number | null>>;
  onRefreshAction: () => void;
}): React.ReactNode {
  // TODO(ayvi) add alert on invalid value http://ayvi:3000/ayvi/dailies/issues/2
  const [_showError, setShowError] = useState<boolean>(false);

  const handleOnChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    let value = parseInt(event.target.value, 10);
    if (!Number.isNaN(value)) {
      if (value <= routine.maxValue) {
        setInputValueAction(value);
        routine.value = value;
        onRefreshAction();
        await invoke<Routine[]>("handle_value_change", { routine: routine });
      }
    } else {
      setShowError(true);
    }
    event.target.blur();
  };

  const handleInputClick = (event: React.MouseEvent<HTMLInputElement, MouseEvent>): void => {
    // @ts-ignore
    event.target.select();
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const handleOuterDivClick = async (_event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  };

  const onKeyDown = async (event: React.KeyboardEvent) => {
    if (["Backspace", "Delete"].includes(event.key)) {
      setInputValueAction(null);
      routine.value = null;
      await invoke<Routine[]>("handle_value_change", { routine: routine });
    } else if (["Enter", "Escape"].includes(event.key)) {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  let border_color: string = clsx(
    "border-blue-700",
    routine.value ?? "border-transparent",
    routine.value == 0 && "border-red-700",
    routine.value == routine.maxValue && "border-green-700",
  );

  let text_color: string = clsx(
    "text-blue-700",
    routine.value ?? "text-transparent",
    routine.value == 0 && "text-red-700",
    routine.value == routine.maxValue && "text-green-700",
  );

  return (
    <CursorTracker>
      <TextCursorInput />
      <div
        className={`border-4 border-dotted select-none ${border_color} rounded-full`}
        onClick={handleOuterDivClick}
      >
        <div className="mt-1 mr-15 mb-1 ml-15 flex items-center text-lg font-semibold lg:mr-30 lg:ml-30">
          {/* TODO(ayvi) input more than 1 char http://ayvi:3000/ayvi/dailies/issues/9 */}
          <Input
            id={routine.valueId}
            // TODO(ayvi) must allow float values http://ayvi:3000/ayvi/dailies/issues/1
            maxLength={String(routine.maxValue).length}
            value={`${inputValue ?? ""}`}
            ref={inputRef}
            className={` ${text_color} data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative flex h-9 max-w-9 border-y border-r border-none text-lg shadow-xs transition-all outline-none first:rounded-l-md first:border-l has-disabled:opacity-50 data-[active=true]:z-10 data-[active=true]:ring-[3px]`}
            onChange={handleOnChange}
            onClick={handleInputClick}
            onKeyDown={onKeyDown}
          />
          <div className="mr-4 ml-1">
            <p className={`${text_color}`}>/</p>
          </div>
          <p className={`${text_color}`}>{routine.maxValue}</p>
        </div>
      </div>
    </CursorTracker>
  );
}
