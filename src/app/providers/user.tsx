"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import ok from "assert";
import { toast } from "sonner";

import logout from "@/actions/logout";
import { getSession } from "@/actions/session";
import { Option } from "@/types/option";

export type User = {
  id: number;
  name: string;
  created: Date;
  updated: Date;
};

export type DecodedToken = {
  userName: string;
  iat: number;
};

export type Session = {
  id: string;
};

export type UserState = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<Option<User>>>;
};

const UserContext = React.createContext<Option<UserState>>(null);

const MAX_RETRIES = 3;

export default function UserProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  const [user, setUser] = React.useState<Option<User>>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Option<string>>(null);
  const retryCount = React.useRef<number>(0);

  const loadSession = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result: Option<User> = await getSession();
      setUser(result);
    } catch (err: unknown) {
      console.error(err);
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        const delay = Math.min(1000 * 2 ** retryCount.current, 8000);
        await new Promise((r) => setTimeout(r, delay));
        return loadSession();
      }
      setError(`${err}`);
      toast.error(`${err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSession();
  }, [loadSession]);

  if (loading) {
    return (
      <div className="absolute flex h-screen w-full items-center justify-center">
        <span className="pr-2 text-xs text-[#f0f0ff]">Logging in</span>
        <heroui.Spinner className="dark" size="sm" variant="spinner" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <p className="text-foreground/60 text-sm">{error ?? "Session expired"}</p>
        <div className="flex gap-2">
          <heroui.Button
            size="sm"
            variant="solid"
            onPress={() => {
              retryCount.current = 0;
              loadSession();
            }}
          >
            Retry
          </heroui.Button>
          <heroui.Button color="danger" size="sm" variant="solid" onPress={() => logout()}>
            Logout
          </heroui.Button>
        </div>
      </div>
    );
  }

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export function useState<
  State = { user: User; setUser: React.Dispatch<React.SetStateAction<User>> },
>(): State {
  const context = React.useContext<Option<UserState>>(UserContext);
  ok(context, new Error("User state was used outside of its Provider"));
  return context as State;
}
