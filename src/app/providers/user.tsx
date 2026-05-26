"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import { Result, ResultAsync, err, ok } from "neverthrow";
import { RedirectType, redirect } from "next/navigation";

import { DecodedToken, getSessionDecoded } from "@/actions/session";
import { getUser } from "@/actions/user";
import { Option } from "@/types/option";

export type User = {
  id: number;
  name: string;
  created: Date;
  updated: Date;
};

export type UseUserParams = {
  fallbackPath: string;
};

const UserContext = React.createContext<Result<Option<User>, Error>>(
  err(new Error("User state was used outside of its Provider")),
);

export function useUser(opts?: UseUserParams): Result<User, Error> {
  return React.useContext<Result<Option<User>, Error>>(UserContext).andThen<Result<User, Error>>(
    (t) => {
      if (!t) {
        if (opts && opts.fallbackPath) redirect(opts.fallbackPath, RedirectType.replace);
        else return err(new Error("No user logged in"));
      } else {
        return ok(t);
      }
    },
  );
}

export default function UserProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  const [user, setUser] = React.useState<Option<User>>(null);
  const [loading, setLoading] = React.useState(true);

  const loadSession = React.useCallback(async (): Promise<ResultAsync<User, Error>> => {
    setLoading(true);
    const session: Result<DecodedToken, Error> = await getSessionDecoded();
    return session.asyncAndThen((t) =>
      getUser({ name: t.userName, id: null }).andTee((t) => setUser(t)),
    );
  }, []);

  ReactUse.useMount(async () => await loadSession().then(() => setLoading(false)));

  if (loading) {
    return (
      <div className="absolute flex h-screen w-full items-center justify-center">
        <span className="pr-2 text-xs text-[#f0f0ff]">Logging in</span>
        <heroui.Spinner className="dark" size="sm" variant="spinner" />
      </div>
    );
  }

  return <UserContext.Provider value={ok(user)}>{children}</UserContext.Provider>;
}
