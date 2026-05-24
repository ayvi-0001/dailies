import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { SkullIcon } from "lucide-react";
import { toast } from "sonner";

import CONTEXT_MENU_CLASSNAME from "./props";

type MenuOptionProps = {
  menuTitle?: string;
  pointId: string;
};

export default function DeleteMenuOption(props: MenuOptionProps) {
  const { menuTitle, pointId } = props;

  return (
    <RadixContextMenu.Item
      className={CONTEXT_MENU_CLASSNAME as string}
      onSelect={async () => {
        toast.promise(
          async () => {
            (await import("@tauri-apps/api/core")).invoke("delete_daily", {
              point_id: pointId,
            });
          },
          {
            loading: "Deleting record...",
            success: () => { return `Deleted`; },
            error: "Error",
          },
        );
        // TODO(ayvi): remove card without reloading page http://ayvi:3000/ayvi/dailies/issues/110
        window.location.reload();
      }}
    >
      <div className="flex flex-row gap-2">
        <SkullIcon height="16px" stroke="#e3e3e3" width="16px" />
        <p className="text-xs text-red-400">{menuTitle ?? "Delete"}</p>
      </div>
    </RadixContextMenu.Item>
  );
}
