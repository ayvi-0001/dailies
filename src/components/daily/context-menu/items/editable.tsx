import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { cn } from "@heroui/react";
import clsx from "clsx";
import { LockKeyholeIcon, LockKeyholeOpenIcon } from "lucide-react";

import CONTEXT_MENU_CLASSNAME from "./props";

type MenuOptionProps = {
  menuTitle?: string;
  overrideEditable: boolean;
  toggleOverrideEditableAction: () => void;
};

export default function EditableLockMenuOption(props: MenuOptionProps) {
  return (
    <RadixContextMenu.Item
      className={cn(
        CONTEXT_MENU_CLASSNAME as string,
        clsx(
          !props.overrideEditable
            ? "bg-green-950 outline-3 outline-green-950"
            : "bg-red-950 outline-3 outline-red-950",
        ),
      )}
      onSelect={props.toggleOverrideEditableAction}
    >
      <div className="flex flex-row gap-2">
        {props.overrideEditable ? (
          <LockKeyholeIcon size={2} stroke="#e3e3e3" />
        ) : (
          <LockKeyholeOpenIcon size={2} stroke="#e3e3e3" />
        )}
        <p className="text-xs text-white">{props.menuTitle ?? "Editable"}</p>
      </div>
    </RadixContextMenu.Item>
  );
}
