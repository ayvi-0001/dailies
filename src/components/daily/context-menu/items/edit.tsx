import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { BookTextIcon } from "lucide-react";

import CONTEXT_MENU_CLASSNAME from "./props";

type MenuOptionProps = {
  menuTitle?: string;
  onOpen: () => void;
};

export default function EditMenuOption(props: MenuOptionProps) {
  const { menuTitle, onOpen } = props;

  return (
    <RadixContextMenu.Item className={CONTEXT_MENU_CLASSNAME as string} onSelect={onOpen}>
      <div className="flex flex-row gap-2">
        <BookTextIcon size={2} stroke="#e3e3e3" />
        <p className="text-xs text-white">{menuTitle ?? "Edit"}</p>
      </div>
    </RadixContextMenu.Item>
  );
}
