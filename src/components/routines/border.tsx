import React from "react";

export default function CardBorder({
  children,
}: React.PropsWithChildren): React.ReactElement {
  return (
    <div
      className="select-none box-content border-yellow-400/80 m-5 py-1 isolate bg-white/78 shadow-lg ring-1 ring-black/5 relative size-auto transition-all duration-300 ease-in-out hover:border-yellow/40 hover:translate-y-[-1px] hover:shadow-lg border-4"
      style={{ height: 150 } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
