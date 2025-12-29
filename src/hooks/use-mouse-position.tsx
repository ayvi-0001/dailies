import * as React from "react";

import { Option } from "@/types/option";

export type Coordinates = { x: number; y: number };

export default function useMousePosition(
  ref: React.RefObject<Option<HTMLElement>>,
  callback: ({ x, y }: { x: number; y: number }) => void,
) {
  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const { top, left } = ref?.current?.getBoundingClientRect() || {
        top: 0,
        left: 0,
      };
      callback?.({ x: clientX - left, y: clientY - top });
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch: Touch = event?.touches?.[0];
      const { clientX, clientY } = touch;
      const { top, left } = ref?.current?.getBoundingClientRect() || {
        top: 0,
        left: 0,
      };
      callback?.({ x: clientX - left, y: clientY - top });
    };

    // The ref value 'ref.current' will likely have changed by the time this effect cleanup function runs.
    // Copying 'ref.current' to a variable inside the effect and using that variable in the cleanup function.
    const nodeRef: Option<HTMLElement> | undefined = ref?.current;

    nodeRef?.addEventListener("mousemove", handleMouseMove, { passive: true });
    nodeRef?.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      nodeRef?.removeEventListener("mousemove", handleMouseMove);
      nodeRef?.removeEventListener("touchmove", handleTouchMove);
    };
  }, [ref, callback]);
}
