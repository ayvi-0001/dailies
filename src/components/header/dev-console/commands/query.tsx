import type { TerminalCommand, TerminalContext } from "@/components/ui/terminal";

const dataCommands: TerminalCommand[] = [
  {
    name: "execute",
    run: async (ctx: TerminalContext) => {
      return await (
        await import("@tauri-apps/api/core")
      ).invoke("raw_query_execute", {
        query: ctx.args.join(" "),
      });
    },
  },
  {
    name: "fetch",
    run: async (ctx: TerminalContext) => {
      return await (
        await import("@tauri-apps/api/core")
      ).invoke("raw_query_fetch", {
        query: ctx.args.join(" "),
      });
    },
  },
];

export default dataCommands;
