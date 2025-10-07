import React from "react";

export default function CardBorder({ children }: React.PropsWithChildren): React.ReactElement {
  return (
    <div
      className={`hover:border-yellow/40 relative isolate box-content size-auto border-4 border-yellow-400/80 bg-white/78 shadow-lg ring-1 ring-black/5 transition-all duration-300 ease-in-out select-none hover:translate-y-[-1px] hover:shadow-lg`}
      style={{ height: 150 } as React.CSSProperties}
    >
      <div className="mr-4 ml-4">{children}</div>
    </div>
  );
}
