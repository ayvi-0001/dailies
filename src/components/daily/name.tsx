import * as React from "react";

export default function NameLabel({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-row">
      <p className="text-5xl font-bold tracking-tight text-black">{title}</p>
      {children}
    </div>
  );
}
