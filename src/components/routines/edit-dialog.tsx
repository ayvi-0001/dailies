import React from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Routine } from "../../types/routines";

// TODO(ayvi) complete edit dialog http://ayvi:3000/ayvi/dailies/issues/13
export default function EditDialog({
  routine,
}: {
  routine: Routine;
}): React.ReactNode {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            edit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-black text-white">
          <DialogHeader>
            <DialogTitle>{routine.name}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">name</Label>
              <Input
                autoComplete="false"
                aria-autocomplete="none"
                id="name-1"
                name="name"
                defaultValue={routine.name}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="type-1">type</Label>
              <Input
                autoComplete="false"
                aria-autocomplete="none"
                id="type-1"
                name="type"
                defaultValue={routine.type}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="group-1">group</Label>
              <Input
                autoComplete="false"
                aria-autocomplete="none"
                id="group-1"
                name="group"
                defaultValue={routine.group}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="weight-1">weight</Label>
              <Input
                autoComplete="false"
                aria-autocomplete="none"
                id="weight-1"
                name="weight"
                defaultValue={routine.weight}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="maxValue-1">maxValue</Label>
              <Input
                autoComplete="false"
                aria-autocomplete="none"
                id="maxValue-1"
                name="maxValue"
                defaultValue={routine.maxValue}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="timeMin-1">timeMin</Label>
              <Input
                autoComplete="false"
                aria-autocomplete="none"
                id="timeMin-1"
                name="timeMin"
                defaultValue={routine.timeMin ?? ""}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="timeMax-1">timeMax</Label>
              <Input
                autoComplete="false"
                aria-autocomplete="none"
                id="timeMax-1"
                name="timeMax"
                defaultValue={routine.timeMax ?? ""}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="notes-1">notes</Label>
              <Input
                autoComplete="false"
                aria-autocomplete="none"
                id="notes-1"
                name="notes"
                defaultValue={routine.notes ?? ""}
              />
            </div>
            {/* TODO(ayvi): dropdown for weekdays */}
            <div className="grid gap-3">
              <Label htmlFor="weekDays-1">weekDays</Label>
              <Input
                autoComplete="false"
                aria-autocomplete="none"
                id="weekDays-1"
                name="weekDays"
                defaultValue={routine.weekDays ? `${routine.weekDays}` : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild className="text-black">
              <Button variant="ghost">cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              {/* TODO(ayvi) send data to tauri */}
              <Button type="submit">save</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
