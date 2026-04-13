"use client";

import * as React from "react";

import * as ReactUse from "@reactuses/core";
import { type ClassValue, clsx } from "clsx";

import { cn } from "@/lib/utils";
import type { Option } from "@/types/option";

interface SpeedialProps {
  actionButtons?: Array<{
    icon: React.ReactNode;
    label: React.ReactNode;
    key: string;
    buttonAction: (event: React.MouseEvent<HTMLButtonElement>) => void;
  }>;
  buttonIcon: React.ReactElement;
  buttonProps?: React.ComponentProps<"button">;
  direction: SpeeddialDirection;
  divProps?: React.ComponentProps<"div">;
}

export enum SpeeddialDirection {
  up = "up",
  down = "down",
  right = "right",
  left = "left",
}

interface TooltipProps {
  text: React.ReactNode;
  children: React.ReactNode;
  direction: SpeeddialDirection;
}

const GLASSY_CLASSES: ClassValue = cn(
  "backdrop-filter backdrop-blur-xl bg-transparent ",
  "border border-white rounded-xl ",
  "shadow-lg transition-all duration-300",
);

const Tooltip: React.FC<TooltipProps> = ({ text, children, direction }): React.ReactElement => {
  const ref = React.useRef<Option<HTMLDivElement>>(null);
  const hovered: boolean = ReactUse.useHover(ref);

  return (
    <div ref={ref} className="relative inline-block">
      {children}
      {hovered && (
        <div
          className={cn(
            clsx(
              [SpeeddialDirection.up, SpeeddialDirection.down].includes(direction)
                ? "absolute top-1/2 left-full z-500 ml-2 -translate-y-1/2 transform rounded bg-gray-800 px-2 py-1 text-sm text-white"
                : "absolute bottom-full left-1/2 z-500 mb-2 -translate-x-1/2 transform rounded bg-gray-800 px-2 py-1 text-sm text-white",
            ),
          )}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default function Speeddial(props: SpeedialProps): React.ReactElement {
  const ref = React.useRef<Option<HTMLDivElement>>(null);
  const hovered: boolean = ReactUse.useHover(ref);

  const getAnimation = () => {
    switch (props.direction) {
      case SpeeddialDirection.up:
        return "origin-bottom flex-col order-0";
      case SpeeddialDirection.down:
        return "origin-top flex-col order-2";
      case SpeeddialDirection.left:
        return "origin-right order-0";
      case SpeeddialDirection.right:
        return "origin-left order-2";
      default:
        return "";
    }
  };

  return (
    <div
      {...props.divProps}
      ref={ref}
      className={cn(
        "relative mb-3 flex w-fit items-center gap-3",
        clsx(
          [SpeeddialDirection.up, SpeeddialDirection.down].includes(props.direction)
            ? "flex-col"
            : [SpeeddialDirection.right, SpeeddialDirection.left].includes(props.direction)
              ? "flex-row"
              : "",
        ),
        props.divProps?.className,
      )}
    >
      <button
        className={cn(
          GLASSY_CLASSES,
          "order-0 flex items-center p-3 text-gray-800 transition-all duration-300",
          props.buttonProps?.className,
        )}
      >
        {props.buttonIcon}
      </button>
      {/* Speed Dial Actions */}
      <div
        className={cn(
          clsx(hovered ? "scale-100 opacity-100" : "scale-0 opacity-0"),
          "flex items-center gap-3 transition-all duration-500 ease-in-out",
          getAnimation(),
        )}
      >
        {(props.actionButtons || []).map((action, index) => (
          <Tooltip key={index} direction={props.direction} text={action.label}>
            <button
              key={index}
              className={cn(
                GLASSY_CLASSES,
                "flex items-center p-3 text-gray-800 transition-all duration-300",
                props.buttonProps?.className,
              )}
              onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
                action.buttonAction(event)
              }
            >
              {action.icon}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
