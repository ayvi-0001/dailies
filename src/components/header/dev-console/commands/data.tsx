import { exportUserData, importUserData } from "@/actions/data";
import type { TerminalCommand, TerminalContext } from "@/components/ui/terminal";
import Utils from "@/lib/utils";

const dataCommands: TerminalCommand[] = [
  {
    name: "export",
    run: async (ctx: TerminalContext) => {
      const arg = ctx.args.at(0);
      switch (arg) {
        case "--help":
        case "-h":
          return (
            <div className="flex flex-col">
              <span>
                <span className="font-bold text-purple-500">Usage</span>: export{" "}
                <span className="font-bold text-purple-500">[ARGS]</span>
              </span>
              <span className="mt-2 font-bold text-purple-500">Arguments:</span>
              <span className="grid grid-cols-2">
                <span className="pl-4">file</span>
                <span>The output directory. If omitted, a folder picker dialog will open</span>
              </span>
            </div>
          );
        default:
          return JSON.stringify(
            exportUserData(
              await (await import("@/actions/session")).getSession(),
              arg && arg !== "" ? arg : null,
            ),
            Utils.sortKeysReplacer,
            2,
          );
      }
    },
  },
  {
    name: "import",
    run: async (ctx: TerminalContext) => {
      const arg = ctx.args.at(0);
      switch (arg) {
        case "--help":
        case "-h":
          return (
            <div className="flex flex-col">
              <span>
                <span className="font-bold text-purple-500">Usage</span>: import{" "}
                <span className="font-bold text-purple-500">[ARGS]</span>
              </span>
              <span className="mt-2 font-bold text-purple-500">Arguments:</span>
              <span className="grid grid-cols-2">
                <span className="pl-4">file</span>
                <span>The data export file. If omitted, a file picker dialog will open</span>
              </span>
            </div>
          );
        default:
          return JSON.stringify(
            importUserData(
              await (await import("@/actions/session")).getSession(),
              arg && arg !== "" ? arg : null,
            ),
            Utils.sortKeysReplacer,
            2,
          );
      }
    },
  },
];

export default dataCommands;
