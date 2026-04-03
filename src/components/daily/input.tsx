"use client";

import * as React from "react";

import * as ReactUse from "@reactuses/core";
import { invoke } from "@tauri-apps/api/core";
import { type ClassValue, clsx } from "clsx";
import { TextCursorInput } from "lucide-react";
import { toast } from "sonner";

import { AppMetaState, useAppMetaState } from "@/app/providers/app-meta";
import CursorTracker from "@/components/animata/container/cursor-tracker";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/option";

import type { Daily } from "./types";

type PointsInputProps = {
  daily: Daily;
  points: Option<string>;
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>;
  updateDailyAction: (pointId: string, patch: Partial<Daily>) => void;
};

export default function PointsInput(props: PointsInputProps): React.ReactNode {
  const { daily, points, setPointsAction, updateDailyAction } = props;

  const appMeta: AppMetaState = useAppMetaState();

  const inputRef = React.useRef<Option<HTMLInputElement>>(null);

  const { value: inputCancelled, toggle: toggleInputCancel } = ReactUse.useBoolean();
  const [restorePoints, setRestorePoints] = React.useState<Option<string>>(points);

  const handleOnChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    setPointsAction(event.currentTarget.value?.slice(0, 6));
  };

  const handleOuterDivClick = async (
    _: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ): Promise<void> => {
    inputRef?.current?.select();
  };

  const handleOnBlurCapture = async (event: React.FocusEvent<HTMLInputElement>): Promise<void> => {
    if (inputCancelled) {
      toggleInputCancel();
      setPointsAction(restorePoints);
      event.stopPropagation();
    }
  };

  const handleOnBlur = async (_: React.FocusEvent<HTMLInputElement>): Promise<void> => {
    if (points != restorePoints) {
      const pointsEval = +`${points}`;

      if (!Number.isNaN(pointsEval)) {
        setPointsAction(pointsEval.toString());
        setRestorePoints(pointsEval.toString());
        daily.points = pointsEval;
        updateDailyAction(daily.pointId, { points: pointsEval });
        await invoke<Daily[]>("handle_point_change", { daily: daily });
      } else {
        toast.error("Invalid value", { description: `${points} not a valid numeric value.` });
      }
    }
  };

  const handleOnKeyDownCapture = async (event: React.KeyboardEvent): Promise<void> => {
    // will blur onKeyDown
    if (["Escape"].includes(event.key)) {
      toggleInputCancel();
    }
  };

  const handleOnKeyDown = async (event: React.KeyboardEvent) => {
    if (["Backspace", "Delete"].includes(event.key) && event.ctrlKey) {
      setPointsAction(null);
      setRestorePoints(null);
      updateDailyAction(daily.pointId, { points: null });
      await invoke<Daily[]>("handle_point_change", { daily: daily });
    } else if (["Escape"].includes(event.key)) {
      inputRef?.current?.blur();
    } else if (["Enter"].includes(event.key)) {
      inputRef?.current?.blur();
    }
  };

  const handleFocus = async (_: React.FocusEvent<HTMLInputElement>): Promise<void> => {
    inputRef?.current?.select();
  };

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
        <InputCell
          borderClassValue={borderClassValue}
          daily={daily}
          handleFocus={handleFocus}
          handleOnBlur={handleOnBlur}
          handleOnBlurCapture={handleOnBlurCapture}
          handleOnChange={handleOnChange}
          handleOnKeyDown={handleOnKeyDown}
          handleOnKeyDownCapture={handleOnKeyDownCapture}
          handleOuterDivClick={handleOuterDivClick}
          inputRef={inputRef}
          points={points}
          textClassValue={textClassValue}
        />
      );
    default:
      return (
        <CursorTracker platform={appMeta.platform}>
          <TextCursorInput />
          <InputCell
            borderClassValue={borderClassValue}
            daily={daily}
            handleFocus={handleFocus}
            handleOnBlur={handleOnBlur}
            handleOnBlurCapture={handleOnBlurCapture}
            handleOnChange={handleOnChange}
            handleOnKeyDown={handleOnKeyDown}
            handleOnKeyDownCapture={handleOnKeyDownCapture}
            handleOuterDivClick={handleOuterDivClick}
            inputRef={inputRef}
            points={points}
            textClassValue={textClassValue}
          />
        </CursorTracker>
      );
  }
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 placeholder:text-muted-foreground dark:bg-input/30 border-input selection:bg-primary selection:text-primary-foreground file:text-foreground",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "min-w-2 border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-[3px]",
        "pointer-events-none cursor-not-allowed disabled:opacity-50",
        className,
      )}
      data-slot="input"
      {...props}
    />
  );
}

type InputCellProps = {
  borderClassValue: ClassValue;
  daily: Daily;
  handleFocus: (event: React.FocusEvent<HTMLInputElement>) => Promise<void>;
  handleOnBlur: (event: React.FocusEvent<HTMLInputElement>) => Promise<void>;
  handleOnBlurCapture: (event: React.FocusEvent<HTMLInputElement>) => Promise<void>;
  handleOnChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleOnKeyDown: (event: React.KeyboardEvent) => Promise<void>;
  handleOnKeyDownCapture: (event: React.KeyboardEvent) => Promise<void>;
  handleOuterDivClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => Promise<void>;
  inputRef: React.RefObject<Option<HTMLInputElement>>;
  points: Option<string>;
  textClassValue: ClassValue;
};

const InputCell = (props: InputCellProps): React.ReactElement => {
  const {
    daily,
    points,
    borderClassValue,
    textClassValue,
    inputRef,
    handleOnChange,
    handleOuterDivClick,
    handleFocus,
    handleOnKeyDownCapture,
    handleOnKeyDown,
    handleOnBlurCapture,
    handleOnBlur,
  } = props;

  return (
    <div
      className={cn(
        borderClassValue,
        "max-w-[6rem] min-w-[6rem] hover:outline-2 hover:outline-offset-2 hover:outline-dashed",
      )}
      onClick={handleOuterDivClick}
    >
      <div className="flex place-content-center items-center justify-self-center-safe">
        <Input
          ref={inputRef}
          multiple
          autoComplete="off"
          className={cn(
            textClassValue,
            "mr-1 field-sizing-content",
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
          height={1}
          id={daily.pointId}
          inputMode="numeric"
          pattern="\d*\.?\d*"
          type="number"
          value={points ?? ""}
          onBlur={handleOnBlur}
          onBlurCapture={handleOnBlurCapture}
          onChange={handleOnChange}
          onFocus={handleFocus}
          onKeyDown={handleOnKeyDown}
          onKeyDownCapture={handleOnKeyDownCapture}
        />
        <span className={cn("mr-2 ml-1", textClassValue)}>/</span>
        <p className={`${textClassValue}`}>{daily.total}</p>
      </div>
    </div>
  );
};
