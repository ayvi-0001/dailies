import React from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import type { Routine } from "../../types/routines";

export default function HistoryDrawer({
  routine,
}: {
  routine: Routine;
}): React.ReactElement {
  const [openHistory, setOpenHistory] = React.useState<boolean>(false);

  return (
    <Drawer open={openHistory} onOpenChange={setOpenHistory}>
      {/* TODO(ayvi): editable history http://ayvi:3000/ayvi/dailies/issues/14 */}
      <DrawerTrigger asChild>
        <Button variant="default" size="sm">
          history
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-black border-white border-1">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-white">{routine.name}</DrawerTitle>
          <DrawerDescription className="text-white">
            {"< TODO >"}
          </DrawerDescription>
          <div className="h-screen"></div>
        </DrawerHeader>
        <div className="px-4"></div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="ghost" size="sm">
              cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
