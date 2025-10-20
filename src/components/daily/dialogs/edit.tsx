import * as React from "react";

import { EditSquare } from "@/components/svgs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Option } from "@/types/option";

import EditDailyForm from "../forms/edit";
import { Daily } from "../types";

export default function EditDailyDialog({
  title,
  daily,
  onRefreshAction,
}: {
  title: string;
  daily: Daily;
  onRefreshAction: () => void;
}): React.ReactNode {
  const dailyFormRef: React.RefObject<Option<HTMLFormElement>> = React.createRef();

  const handleSubmitButtonRef = async (): Promise<void> => {
    dailyFormRef?.current?.requestSubmit();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <EditSquare />
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[80vh] bg-black/90 text-white">
        <ScrollArea className="h-[70vh] rounded-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="mb-5">
              Value changes will apply to the current date.
            </DialogDescription>
          </DialogHeader>
          <EditDailyForm
            daily={daily}
            dailyFormRef={dailyFormRef}
            onRefreshAction={onRefreshAction}
          />
          <DialogFooter className="mt-4 mb-3 flex justify-center gap-2 leading-none font-medium select-none">
            <DialogClose asChild className="text-black">
              <Button
                variant="outline"
                className="hover:slate-700/90 bg-slate-700 text-slate-300 shadow"
              >
                cancel
              </Button>
            </DialogClose>
            <DialogClose asChild className="text-black">
              <Button
                variant="outline"
                className="hover:gray-300/90 bg-gray-300 text-gray-700 shadow"
                onClick={handleSubmitButtonRef}
              >
                save
              </Button>
            </DialogClose>
          </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
