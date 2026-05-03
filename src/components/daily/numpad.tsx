"use client";

import * as React from "react";

import * as RadixPopover from "@radix-ui/react-popover";
import * as ReactUse from "@reactuses/core";
import { invoke } from "@tauri-apps/api/core";
import { type ClassValue } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { DeleteIcon } from "lucide-react";
import { toast } from "sonner";

import { useAppMetaState } from "@/app/providers/app-meta";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/option";

import type { Daily } from "./types";

const MAX_POINTS_LENGTH = 6;

type NumpadPopoverProps = {
  children: React.ReactNode;
  daily: Daily;
  open: boolean;
  points: Option<string>;
  setOpenAction: (value: boolean) => void;
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>;
  updateDailyAction: (pointId: string, patch: Partial<Daily>) => void;
};

export function NumpadPopover(props: NumpadPopoverProps): React.ReactElement {
  const { children, daily, open, points, setOpenAction, setPointsAction, updateDailyAction } =
    props;

  const appMeta = useAppMetaState();
  const hotkeysEnabled = appMeta.platform !== "android";

  const [pressedKey, setPressedKey] = React.useState<Option<string>>(null);
  const [portalContainer, setPortalContainer] = React.useState<Option<HTMLElement>>(null);
  const triggerRef = React.useRef<Option<HTMLButtonElement>>(null);
  const replaceOnNextRef = React.useRef<boolean>(true);
  const restorePointsRef = React.useRef<Option<string>>(points);
  const pointsRef = React.useRef<Option<string>>(points);
  const pressTimerRef = React.useRef<Option<ReturnType<typeof setTimeout>>>(null);

  React.useEffect(() => void (pointsRef.current = points), [points]);

  const commit = async (): Promise<void> => {
    const next = pointsRef.current;
    const restore = restorePointsRef.current;

    if (next === restore) return;

    if (next === null) {
      setPointsAction(null);
      updateDailyAction(daily.pointId, { points: null });
      daily.points = null;
      await invoke<Daily[]>("handle_point_change", { daily });
      return;
    } else if (`${next}`.trim() === "") {
      setPointsAction(`${0}`);
      updateDailyAction(daily.pointId, { points: 0 });
      daily.points = 0;
      await invoke<Daily[]>("handle_point_change", { daily });
      return;
    }

    const pointsEval = +`${next}`;
    if (Number.isNaN(pointsEval)) {
      toast.error("Invalid value", { description: `${next} not a valid numeric value.` });
      setPointsAction(restore);
      return;
    }

    setPointsAction(pointsEval.toString());
    daily.points = pointsEval;
    updateDailyAction(daily.pointId, { points: pointsEval });
    await invoke<Daily[]>("handle_point_change", { daily });
  };

  const handleOpenChange = (next: boolean): void => {
    if (next) {
      restorePointsRef.current = pointsRef.current;
      replaceOnNextRef.current = true;
      const trigger = triggerRef.current;
      if (trigger) {
        const ancestor =
          trigger.closest<HTMLElement>(
            '[role="dialog"], [role="alertdialog"], [data-slot="base"]',
          ) ?? null;
        setPortalContainer(ancestor);
      }
    } else {
      void commit();
    }
    setOpenAction(next);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const appendChar = (ch: string): void => {
    setPointsAction(prev => {
      const current = replaceOnNextRef.current ? "" : (prev ?? "");
      if (ch === "." && current.includes(".")) return current;
      if (current.length >= MAX_POINTS_LENGTH) return current;
      return current + ch;
    });
    replaceOnNextRef.current = false;
  };

  const backspace = (): void => {
    setPointsAction(prev => {
      const current = replaceOnNextRef.current ? "" : (prev ?? "");
      const next = current.slice(0, -1);
      return next === "" ? "" : next;
    });
    replaceOnNextRef.current = false;
  };

  // TODO(ayvi): replace abandon context menu item with this?
  const clear = (): void => {
    setPointsAction(null);
    replaceOnNextRef.current = false;
  };

  const flashKey = (k: string): void => {
    setPressedKey(k);
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => setPressedKey(null), 120);
  };

  React.useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (!hotkeysEnabled || !open) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      const k = event.key;
      const isDigit = /^[0-9]$/.test(k);
      const isHandled =
        isDigit || k === "." || k === "Backspace" || k === "Enter" || k === "Escape";
      if (!isHandled) return;
      event.preventDefault();
      event.stopPropagation();
      if (k === "Backspace") {
        flashKey("Backspace");
        backspace();
      } else if (k === "Enter") {
        void commit();
        setOpenAction(false);
      } else if (k === "Escape") {
        setPointsAction(restorePointsRef.current);
        setOpenAction(false);
      } else if (k === ".") {
        flashKey(".");
        appendChar(".");
      } else if (isDigit) {
        flashKey(k);
        appendChar(k);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hotkeysEnabled]);

  return (
    <RadixPopover.Root open={open} onOpenChange={handleOpenChange}>
      <RadixPopover.Trigger ref={triggerRef} asChild className="select-none">
        {children}
      </RadixPopover.Trigger>
      <RadixPopover.Portal container={portalContainer ?? undefined}>
        <AnimatePresence>
          {open && (
            <RadixPopover.Content
              asChild
              forceMount
              align="end"
              className="dark z-100"
              side="bottom"
              sideOffset={8}
            >
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "rounded-md border border-white/10 bg-black/95 p-3 shadow-lg select-none",
                )}
                exit={{ opacity: 0, scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
                    return (
                      <NumpadKey
                        key={n}
                        numpadKey={`${n}`}
                        pressed={pressedKey === `${n}`}
                        onPress={() => appendChar(`${n}`)}
                      >
                        {n}
                      </NumpadKey>
                    );
                  })}
                  <NumpadKey
                    numpadKey="."
                    pressed={pressedKey === "."}
                    onPress={() => appendChar(".")}
                  >
                    .
                  </NumpadKey>
                  <NumpadKey
                    numpadKey="0"
                    pressed={pressedKey === "0"}
                    onPress={() => appendChar("0")}
                  >
                    0
                  </NumpadKey>
                  <NumpadKey
                    aria-label="Backspace"
                    numpadKey="Backspace"
                    pressed={pressedKey === "Backspace"}
                    onPress={backspace}
                  >
                    <DeleteIcon className="size-5" />
                  </NumpadKey>
                </div>
                <div className="mt-2 flex justify-between gap-2">
                  <button
                    className={cn(
                      "flex-1 rounded-md border border-red-700/40 bg-red-900/20",
                      "px-2 py-1 text-[0.7rem] font-semibold text-red-400",
                      "active:bg-red-900/40",
                    )}
                    type="button"
                    onClick={clear}
                  >
                    Abandon
                  </button>
                  <button
                    className={cn(
                      "flex-1 rounded-md border border-green-700/40 bg-green-900/20",
                      "px-2 py-1 text-[0.7rem] font-semibold text-green-400",
                      "active:bg-green-900/40",
                    )}
                    type="button"
                    onClick={() => {
                      commit();
                      setOpenAction(false);
                    }}
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </RadixPopover.Content>
          )}
        </AnimatePresence>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

type NumpadKeyProps = {
  numpadKey: string;
  children: React.ReactNode;
  onPress: () => void;
  pressed?: boolean;
  "aria-label"?: string;
};

function NumpadKey({
  numpadKey,
  children,
  onPress,
  pressed,
  ...rest
}: NumpadKeyProps): React.ReactElement {
  return (
    <button
      key={numpadKey}
      className={cn(
        "flex size-9 items-center justify-center rounded-md",
        "border border-white/10 bg-white/5 text-sm font-semibold text-white",
        "transition-transform select-none active:scale-95 active:bg-white/15",
        pressed && "scale-95 bg-white/15",
      )}
      type="button"
      onClick={onPress}
      {...rest}
    >
      {children}
    </button>
  );
}

type NumpadInputCellProps = {
  borderClassValue: ClassValue;
  daily: Daily;
  points: Option<string>;
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>;
  textClassValue: ClassValue;
  updateDailyAction: (pointId: string, patch: Partial<Daily>) => void;
};

export function NumpadInputCell(props: NumpadInputCellProps): React.ReactElement {
  const { borderClassValue, daily, points, setPointsAction, textClassValue, updateDailyAction } =
    props;

  const { value: numpadOpen, setValue: setNumpadOpen } = ReactUse.useBoolean(false);
  const { value: longPressed, toggle: toggleLongPressed } = ReactUse.useBoolean(false);
  const [isPending, resetLongPressed] = ReactUse.useTimeoutFn(
    () => {
      setNumpadOpen(false);
      toggleLongPressed();
    },
    1000,
    { immediate: false },
  );

  const onLongPress = async (): Promise<void> => {
    if (daily.points === daily.total) return;

    toggleLongPressed();
    setPointsAction(`${daily.total}`);
    updateDailyAction(daily.pointId, { points: daily.total });
    daily.points = daily.total;
    await invoke<Daily[]>("handle_point_change", { daily });
    if (!isPending) resetLongPressed();
  };

  const longPressEvent = ReactUse.useLongPress(onLongPress, {
    isPreventDefault: false,
    delay: 500,
  });

  return (
    <NumpadPopover
      daily={daily}
      open={longPressed ? false : numpadOpen}
      points={points}
      setOpenAction={setNumpadOpen}
      setPointsAction={setPointsAction}
      updateDailyAction={updateDailyAction}
    >
      <div
        {...longPressEvent}
        className={cn(
          borderClassValue,
          "max-w-[6rem] min-w-[6rem] touch-manipulation",
          "hover:outline-2 hover:outline-offset-2 hover:outline-dashed",
        )}
        role="button"
        tabIndex={0}
      >
        <div className="flex place-content-center items-center justify-self-center-safe">
          <span className={cn(textClassValue, "min-w-[1ch] text-center tabular-nums")}>
            {points ?? ""}
          </span>
          <span className={cn(textClassValue, "px-2")}>/</span>
          <span className={cn(textClassValue, "min-w-[1ch] text-center tabular-nums")}>
            {daily.total}
          </span>
        </div>
      </div>
    </NumpadPopover>
  );
}
