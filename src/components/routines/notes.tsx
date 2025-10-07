import * as React from "react";

import { NoteStack } from "@/components/svgs";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function Notes({
  windowWidth,
  title,
}: {
  windowWidth: number;
  title: string | null;
}): React.ReactElement {
  return windowWidth >= 800 ? (
    <div>
      <p className="text-black overflow-hidden text-ellipsis line-clamp-5">
        {title ?? ""}
      </p>
    </div>
  ) : (
    <div>
      {title && (
        <HoverCard>
          <HoverCardTrigger>
            <Button variant="outline" size="sm" className="bg-transparent border-none">
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
