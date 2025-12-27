import * as React from "react";

import useMousePosition from "@/hooks/use-mouse-position";

/**
 * @component @name CursorTracker
 * @description A wrapper component that tracks the cursor moving within it.
 * The first child component will be used as the cursor.
 *
 * @see https://animata.design/docs/container/cursor-tracker
 */
export default function CursorTracker({
  children,
}: {
  children: React.ReactNode[];
}): React.JSX.Element {
  const cursor = children.at(0);
  const components = children.slice(1);

  const divRef = React.useRef<HTMLDivElement>(null);
  const infoRef = React.useRef<HTMLDivElement>(null);

  const update = React.useCallback(({ x, y }: { x: number; y: number }) => {
    // We need to offset the position to center the info div
    const offsetX = (infoRef.current?.offsetWidth || 0) / 2;
    const offsetY = (infoRef.current?.offsetHeight || 0) / 2;

    // Use CSS variables to position the info div instead of state to avoid re-renders
    infoRef.current?.style.setProperty("--x", `${x - offsetX}px`);
    infoRef.current?.style.setProperty("--y", `${y - offsetY}px`);
  }, []);

  useMousePosition(divRef, update);

  return (
    <div ref={divRef} className="group relative cursor-none rounded-3xl">
      {components}
      {/* Cursor tracker */}
      <div
        ref={infoRef}
        className="pointer-events-none absolute top-0 left-0 z-50 rounded-full bg-black/60 px-4 py-2 text-sm font-bold text-white opacity-0 duration-0 group-hover:opacity-100"
        style={{ transform: "translate(var(--x), var(--y))" }}
      >
        {cursor}
      </div>
    </div>
  );
}
