"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type TerminalLineKind = "input" | "output" | "error" | "info";

export type TerminalLine = {
  id: string;
  kind: TerminalLineKind;
  text: React.ReactNode;
};

export type TerminalContext = {
  args: string[];
  raw: string;
  print: (text: React.ReactNode, kind?: TerminalLineKind) => void;
  clear: () => void;
  history: TerminalLine[];
};

export type TerminalCommand = {
  name: string;
  description?: string;
  aliases?: string[];
  run: (
    ctx: TerminalContext,
  ) => void | string | React.ReactElement | Promise<void | string | React.ReactElement>;
};

export type TerminalProps = {
  commands?: TerminalCommand[];
  prompt?: string;
  welcome?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  promptClassName?: string;
  autoFocus?: boolean;
  caseSensitive?: boolean;
  onUnknownCommandAction?: (name: string, ctx: TerminalContext) => void | string;
};

let lineCounter = 0;
const nextId = () => `tl-${Date.now().toString(36)}-${(lineCounter++).toString(36)}`;

function parseArgs(input: string): string[] {
  const out: string[] = [];
  const re = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    out.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return out;
}

export default function Terminal(props: TerminalProps) {
  const {
    autoFocus = true,
    caseSensitive = false,
    className,
    commands = [],
    inputClassName,
    onUnknownCommandAction: onUnknownCommand,
    prompt = "$",
    promptClassName,
    welcome,
  } = props;

  const [lines, setLines] = React.useState<TerminalLine[]>([]);
  const [value, setValue] = React.useState<string>("");
  const [cmdHistory, setCmdHistory] = React.useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState<number>(-1);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const normalize = React.useCallback(
    (s: string) => (caseSensitive ? s : s.toLowerCase()),
    [caseSensitive],
  );

  const commandMap = React.useMemo(() => {
    const map = new Map<string, TerminalCommand>();
    for (const cmd of commands) {
      map.set(normalize(cmd.name), cmd);
      cmd.aliases?.forEach((a) => map.set(normalize(a), cmd));
    }
    return map;
  }, [commands, normalize]);

  React.useEffect(
    () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
    [lines],
  );

  const print = React.useCallback((text: React.ReactNode, kind: TerminalLineKind = "output") => { setLines((prev) => [...prev, { id: nextId(), kind, text }]); }, []);

  const clear = React.useCallback(() => setLines([]), []);

  const builtins = React.useMemo<TerminalCommand[]>(
    () => [
      {
        description: "clear the terminal",
        name: "clear",
        run: ({ clear: c }) => c(),
      },
      {
        description: "list available commands",
        name: "help",
        run: ({ print: p }) => {
          const all = [
            ...commands,
            { description: "clear the terminal", name: "clear" },
            {
              description: "list available commands",
              name: "help",
            },
          ];
          const width = Math.max(...all.map((c) => c.name.length));
          for (const c of all) {
            p(
              <span className="grid grid-cols-2">
                <span>{`${" ".repeat(prompt.length + 1)}${c.name.padEnd(width)}`}</span>
                <span>{`${c.description ?? ""}`.trimEnd()}</span>
              </span>,
              "info",
            );
          }
        },
      },
    ],
    [commands, prompt.length],
  );

  const fullMap = React.useMemo(() => {
    const map = new Map(commandMap);
    for (const b of builtins) map.set(normalize(b.name), b);
    return map;
  }, [commandMap, builtins, normalize]);

  const submit = React.useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      setLines((prev) => [...prev, { id: nextId(), kind: "input", text: `${prompt} ${raw}` }]);
      if (!trimmed) return;
      setCmdHistory((prev) => (prev[prev.length - 1] === trimmed ? prev : [...prev, trimmed]));

      const args = parseArgs(trimmed);
      const name = args.shift() ?? "";
      const cmd = fullMap.get(normalize(name));

      const ctx: TerminalContext = {
        args,
        clear,
        history: lines,
        print,
        raw: trimmed,
      };

      if (!cmd) {
        const result = onUnknownCommand?.(name, ctx);
        if (React.isValidElement(result) || typeof result === "string") print(result, "error");
        else if (result === undefined) print(`command not found: ${name}`, "error");
        return;
      }

      try {
        const result = await cmd.run(ctx);
        if (React.isValidElement(result) || typeof result === "string") print(result, "output");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        print(msg, "error");
      }
    },
    [clear, fullMap, lines, normalize, onUnknownCommand, print, prompt],
  );

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const raw = value;
    setValue("");
    setHistoryIndex(-1);
    void submit(raw);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "F1") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      inputRef.current?.blur();
    } else if (e.key === "ArrowUp") {
      if (cmdHistory.length === 0) return;
      e.preventDefault();
      const next = historyIndex < 0 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setValue(cmdHistory[next] ?? "");
    } else if (e.key === "ArrowDown") {
      if (historyIndex < 0) return;
      e.preventDefault();
      const next = historyIndex + 1;
      if (next >= cmdHistory.length) {
        setHistoryIndex(-1);
        setValue("");
      } else {
        setHistoryIndex(next);
        setValue(cmdHistory[next] ?? "");
      }
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      clear();
    } else if (e.key === "u" && e.ctrlKey) {
      e.preventDefault();
      setValue("");
    } else if (e.key === "w" && e.ctrlKey) {
      e.preventDefault();
      setValue((value) => {
        value = value.trimEnd().split(" ").slice(0, -1).join(" ");
        if (value.length > 0) value = value.concat(" ");
        return value;
      });
    }
  };

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col rounded-md border-none bg-black/80 font-mono text-[0.75rem] text-white",
        className,
      )}
      data-slot="terminal"
      onClick={() => inputRef.current?.focus()}
    >
      <div
        ref={scrollRef}
        className="scrollbar-hide flex-1 overflow-y-auto p-3 [&>*]:break-words [&>*]:whitespace-pre-wrap"
        data-slot="terminal-output"
      >
        {welcome != null && <div className="text-muted-foreground mb-2">{welcome}</div>}
        {lines.map((l) => (
          <div
            key={l.id}
            className={cn(
              l.kind === "input" && "text-white",
              l.kind === "output" && "text-white",
              l.kind === "error" && "text-red-500",
              l.kind === "info" && "text-muted-foreground",
            )}
          >
            {l.text}
          </div>
        ))}
        <form action="#" className="flex items-center gap-2" onSubmit={onSubmit}>
          <span className={cn("text-white", promptClassName)}>{prompt}</span>
          <input
            ref={inputRef}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            autoFocus={autoFocus}
            className={cn(
              "placeholder:text-muted-foreground flex-1 border-0 bg-transparent outline-none",
              inputClassName,
            )}
            data-slot="terminal-input"
            enterKeyHint="send"
            inputMode="text"
            spellCheck={false}
            style={{ caretShape: "block" }}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button aria-hidden="true" className="sr-only" tabIndex={-1} type="submit">
            submit
          </button>
        </form>
      </div>
    </div>
  );
}
