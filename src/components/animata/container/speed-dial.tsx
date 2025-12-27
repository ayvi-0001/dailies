"use client";

import * as React from "react";

import { BoxIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface SpeedialProps {
  props?: React.ComponentProps<"div">;
  buttonProps?: React.ComponentProps<"button">;
  direction?: string;
  actionButtons?: Array<{
    icon: React.ReactNode;
    label: React.ReactNode;
    key: string;
    buttonAction: (event: React.MouseEvent<HTMLButtonElement>) => void;
  }>;
}

interface TooltipProps {
  text: React.ReactNode;
  children: React.ReactNode;
  direction: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, direction }) => {
  const [visible, setVisible] = React.useState(false);

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => setVisible(false);

  return (
    <div className="relative inline-block" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      {children}
      {visible && (
        <div
          className={` ${
            direction === "up" || direction === "down"
              ? "absolute top-1/2 left-full z-500 ml-2 -translate-y-1/2 transform rounded bg-gray-800 px-2 py-1 text-sm text-white"
              : "absolute bottom-full left-1/2 z-500 mb-2 -translate-x-1/2 transform rounded bg-gray-800 px-2 py-1 text-sm text-white"
          } `}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default function Speeddial({ props, buttonProps, direction, actionButtons }: SpeedialProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  if (direction === undefined) {
    direction = "down";
  }

  const getAnimation = () => {
    switch (direction) {
      case "up":
        return "origin-bottom flex-col order-0";
      case "down":
        return "origin-top flex-col order-2";
      case "left":
        return "origin-right order-0";
      case "right":
        return "origin-left order-2";
      default:
        return "";
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const getGlassyClasses = () => {
    return "backdrop-filter backdrop-blur-xl bg-white border border-white rounded-xl shadow-lg transition-all duration-300";
  };

  return (
    <div
      {...props}
      className={cn(
        `relative mb-3 flex w-fit items-center gap-3 ${
          direction === "up" || direction === "down" ? "flex-col" : "flex-row"
        }`,
        props?.className,
      )}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          `${getGlassyClasses()} order-0 flex items-center p-3 text-gray-800 transition-all duration-300 hover:bg-slate-100`,
          buttonProps?.className,
        )}
        onMouseEnter={handleMouseEnter}
      >
        <BoxIcon size={16} />
      </button>
      {/* Speed Dial Actions */}
      <div
        className={`${
          isHovered ? "scale-100 opacity-100" : "scale-0 opacity-0"
        } flex items-center gap-3 transition-all duration-500 ease-in-out ${getAnimation()}`}
      >
        {(actionButtons || []).map((action, index) => (
          <Tooltip key={index} direction={direction} text={action.label}>
            <button
              key={index}
              className={cn(
                `${getGlassyClasses()} flex items-center p-3 text-gray-800 transition-all duration-300 hover:bg-slate-100`,
                buttonProps?.className,
              )}
              onClick={event => {
                setIsHovered(false);
                action.buttonAction(event);
              }}
            >
              {action.icon}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
