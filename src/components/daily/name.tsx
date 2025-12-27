import * as React from "react";

export default function QuestName({ name }: { name: string }): React.ReactElement {
  return (
    <div className="w-full wrap-anywhere">
      <p className="overflow-hidden text-xl leading-none font-bold tracking-tight text-ellipsis whitespace-nowrap">
        {name}
      </p>
    </div>
  );
}
