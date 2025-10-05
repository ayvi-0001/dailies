import React from "react";

export default function Header({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-row mt-2">
      <p className="text-black font-bold text-4xl tracking-tight">{title}</p>
      {children}
    </div>
  );
}
