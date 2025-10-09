import * as React from "react";

import { NoteStack } from "@/components/svgs";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export default function Notes({
  windowWidth,
  title,
}: {
  windowWidth: number;
  title: string | null;
}): React.ReactElement {
  return windowWidth >= 800 ? (
    <div>
      <p className="line-clamp-4 overflow-hidden text-ellipsis text-black">{title ?? ""}</p>
    </div>
  ) : (
    <div>
      {title && (
        <HoverCard>
          <HoverCardTrigger>
            <Button variant="outline" size="sm" className="border-none bg-transparent">
              <NoteStack fill="#000000" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="bg-black/70">
            <p className="text-sm text-white">{title}</p>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
}
