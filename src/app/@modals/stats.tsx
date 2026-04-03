"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import clsx from "clsx";
import { HTMLMotionProps } from "framer-motion";
import { ReadonlyURLSearchParams, RedirectType, redirect, useSearchParams } from "next/navigation";

import { User, useState as useUserState } from "@/app/providers/user";
import { roundTo } from "@/lib/number";
import { invoke } from "@/lib/tauri";
import { cn } from "@/lib/utils";
import { Option } from "@/types/option";

export default function Modal(): React.ReactElement {
  const searchParams: ReadonlyURLSearchParams = useSearchParams();

  const draggableRef = React.useRef<HTMLElement>(null as unknown as HTMLElement);
  const { moveProps } = heroui.useDraggable({
    targetRef: draggableRef,
    canOverflow: false,
    isDisabled: false,
  });

  const [graphType, setGraphType] = React.useState<string>(`${GraphType.YTD}`);

  const motionProps: Omit<HTMLMotionProps<"div">, "ref"> = {
    variants: {
      enter: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
      exit: { y: -20, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
    },
  };

  return (
    <heroui.Modal
      ref={draggableRef}
      disableAnimation
      hideCloseButton
      isKeyboardDismissDisabled
      shouldBlockScroll
      backdrop="transparent"
      className="dark z-1000 w-9/10 text-white select-none"
      defaultOpen={true}
      isDismissable={false}
      motionProps={motionProps}
      placement="center"
      radius="none"
      shadow="lg"
      size="sm"
    >
      <heroui.ModalContent className="flex border-1 border-gray-600 bg-black/95">
        {onClose => (
          <div>
            <heroui.ModalHeader
              {...moveProps}
              className="text-md flex flex-col gap-1 justify-self-center"
            >
              Stats
            </heroui.ModalHeader>
            <heroui.ModalBody className="bg-black/90 text-white">
              <div className="w-full">
                <heroui.RadioGroup
                  className="w-fit"
                  value={graphType ?? ""}
                  onValueChange={setGraphType}
                >
                  <heroui.Radio classNames={{ label: "text-xs" }} value={`${GraphType.YTD}`}>
                    YTD
                  </heroui.Radio>
                  <heroui.Radio classNames={{ label: "text-xs" }} value={`${GraphType.Last365}`}>
                    Last 365 days
                  </heroui.Radio>
                </heroui.RadioGroup>
              </div>
              <heroui.ScrollShadow orientation="horizontal">
                <DailyHistoryGraph graphType={graphType} />
              </heroui.ScrollShadow>
            </heroui.ModalBody>
            <heroui.ModalFooter className="flex justify-self-center">
              <heroui.Button
                color="danger"
                size="sm"
                variant="light"
                onPress={() => {
                  onClose();
                  redirect(`/?date=${searchParams.get("date")}`, RedirectType.replace);
                }}
              >
                Close
              </heroui.Button>
            </heroui.ModalFooter>
          </div>
        )}
      </heroui.ModalContent>
    </heroui.Modal>
  );
}

const defaultGraphData = Array.from({ length: 53 }, () => Array.from({ length: 7 }, () => 0));

function DailyHistoryGraph({ graphType }: { graphType: string }): React.ReactElement {
  const user: User = useUserState().user!;

  const [values, setValues] = React.useState<Option<number>[][]>([[]]);

  React.useEffect(() => {
    const get_dailies_graph_data = async (): Promise<void> => {
      setValues(defaultGraphData);
      await invoke<Option<number>[][]>("get_dailies_graph_data", {
        graph_type: GraphType[+`${graphType}`],
        user: user.name,
      })
        .then(result => setValues(result))
        .catch(console.error);
    };
    get_dailies_graph_data();
  }, [user, graphType]);

  return (
    <heroui.ScrollShadow
      hideScrollBar
      className="w-full items-center justify-center"
      offset={100}
      orientation="horizontal"
    >
      <div className="flex max-h-80 min-h-80 min-w-80 flex-col place-content-center">
        {values == defaultGraphData ? (
          <div className="flex min-w-80 justify-center">
            <heroui.Spinner variant="wave" />
          </div>
        ) : (
          <div className="flex gap-1">
            {values.map((week, i) => (
              <div
                key={`week-${i}`}
                className="flex flex-col gap-1"
                // className={cn("flex flex-col gap-1", i < 20 ? "hidden md:flex" : "flex")}
                id={`week-${i}`}
              >
                {week.map((value, j) => {
                  return (
                    <div
                      key={`week-${i}-day-${j}`}
                      className={cn(
                        "grid h-9 w-9 rounded-[2px] text-[0.55rem] leading-none text-black",
                        clsx(
                          !value && "bg-gray-950",
                          value && "bg-green-500 font-bold text-white",
                          value && value == 100 && "italic underline",
                          value && value < 90 && "bg-green-600 text-green-50",
                          value && value < 80 && "bg-green-700 text-green-100",
                          value && value < 70 && "bg-green-800 text-green-200",
                          value && value < 60 && "bg-green-950 text-green-300",
                          value && value < 50 && "bg-red-950 text-red-300",
                          value && value < 40 && "bg-red-800 text-red-200",
                          value && value < 30 && "bg-red-700 text-red-100",
                          value && value < 20 && "bg-red-600 text-red-50",
                          value && value < 10 && "bg-red-500 text-white",
                        ),
                      )}
                      id={`week-${i}-day-${j}`}
                    >
                      <div className="self-center justify-self-center">{cellValue(value)}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </heroui.ScrollShadow>
  );

  function cellValue(value: Option<number>): string {
    return value && [100, 0].includes(value)
      ? value.toFixed(0)
      : value
        ? `${roundTo(value, 2).toFixed(2)}%`
        : "";
  }
}

enum GraphType {
  YTD,
  Last365,
}
