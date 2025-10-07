import React from "react";

export default function Header({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-row">
      <p className="text-4xl font-bold tracking-tight text-black">{title}</p>
      {children}
    </div>
  );
}
