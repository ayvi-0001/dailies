import { exportUserData, importUserData } from "@/actions/data";
import { getSessionUser } from "@/actions/session";
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
          const user = await getSessionUser();
          return user.match(
            async (t) => {
              return exportUserData(t).match(
                (t) => JSON.stringify(t, Utils.sortKeysReplacer, 2),
                (e) => { throw e; },
              );
            },
            (e) => { throw e; },
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
          const user = await getSessionUser();
          return user.match(
            async (t) => {
              return importUserData(t).match(
                (t) => JSON.stringify(t, Utils.sortKeysReplacer, 2),
                (e) => { throw e; },
              );
            },
            (e) => { throw e; },
          );
      }
    },
  },
];

export default dataCommands;
