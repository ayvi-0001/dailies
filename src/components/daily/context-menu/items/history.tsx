import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { BookSearchIcon } from "lucide-react";

import CONTEXT_MENU_CLASSNAME from "./props";

type MenuOptionProps = {
  menuTitle?: string;
  toggleHistory: () => void;
};

export default function HistoryMenuOption(props: MenuOptionProps) {
  const { menuTitle, toggleHistory } = props;

  return (
    <RadixContextMenu.Item className={CONTEXT_MENU_CLASSNAME as string} onSelect={toggleHistory}>
      <div className="flex flex-row gap-2">
        <BookSearchIcon size={2} stroke="#e3e3e3" />
        <p className="text-xs text-white">{menuTitle ?? "History"}</p>
      </div>
    </RadixContextMenu.Item>
  );
}
