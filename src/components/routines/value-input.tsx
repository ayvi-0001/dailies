"use client";

import { invoke } from "@tauri-apps/api/core";
import { TextCursorInput } from "lucide-react";
import React from "react";
import { useRef, useState } from "react";

import CursorTracker from "@/components/animata/container/cursor-tracker";
import { Input } from "@/components/ui/input";

import type { Routine } from "../../types/routines";

export default function ValueInput({
  routine,
}: {
  routine: Routine;
}): React.ReactNode {
  const [inputValue, setInputValue] = useState<number>(routine.value);
  // TODO(ayvi) add alert on invalid value http://ayvi:3000/ayvi/dailies/issues/2
  const [_showError, setShowError] = useState<boolean>(false);

  const handleOnChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    // TODO(ayvi) set null values http://ayvi:3000/ayvi/dailies/issues/8
    let value = parseInt(event.target.value, 10);
    if (!Number.isNaN(value)) {
      if (value <= routine.maxValue) {
        setInputValue(value);
        routine.value = value;
        await invoke<Routine[]>("handle_value_change", { routine: routine });
      }
    } else {
      setShowError(true);
    }
    event.target.blur();
  };

  const handleInputClick = (
    event: React.MouseEvent<HTMLInputElement, MouseEvent>,
  ): void => {
    // @ts-ignore
    event.target.select();
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const handleOuterDivClick = async (
    _: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  };

  let border_color: string =
    routine.value == 0
      ? "border-red-700"
      : routine.value == routine.maxValue
        ? "border-green-700"
        : "border-blue-700";

  let text_color: string =
    routine.value == 0
      ? "text-red-700"
      : routine.value == routine.maxValue
        ? "text-green-700"
        : "text-blue-700";

  return (
    <CursorTracker>
      <TextCursorInput />
      <div
        className={`select-none border-dotted border-4 ${border_color} rounded-full`}
        onClick={handleOuterDivClick}
      >
        <div className="flex items-center mr-30 ml-30 mt-1 mb-1 text-lg font-semibold">
          {/* TODO(ayvi) input more than 1 char http://ayvi:3000/ayvi/dailies/issues/9 */}
          <Input
            // TODO(ayvi) must allow float values http://ayvi:3000/ayvi/dailies/issues/1
            maxLength={String(routine.maxValue).length}
            // TODO(ayvi) hide max value if value is null http://ayvi:3000/ayvi/dailies/issues/7
            value={`${inputValue ?? ""}`}
            ref={inputRef}
            className={`${text_color} border-none text-lg gap-2 has-disabled:opacity-50 data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 relative flex h-9 w-9 items-center justify-center border-y border-r shadow-xs transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]`}
            onChange={handleOnChange}
            onClick={handleInputClick}
          />
          <div className={`mr-2 ml-1`}>
            <p className={`${text_color}`}>/</p>
          </div>
          <p className={`${text_color}`}>{routine.maxValue}</p>
        </div>
      </div>
    </CursorTracker>
  );
}
