"use client";

import * as React from "react";

import { invoke } from "@tauri-apps/api/core";
import ok from "assert";

import logout from "@/actions/logout";
import { decrypt } from "@/lib/session";

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
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

const UserContext = React.createContext<UserState | null>(null);

export default function UserProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const get_user_session = async () => {
      // TODO(ayvi): show user error on catch
      try {
        const session = await invoke<string | null>("get_session");

        const token = await decrypt<DecodedToken>(session);

        await invoke<User>("get_user", { username: token?.userName })
          .then(result => setUser(result))
          .catch(console.error);
      } catch (_: unknown) {
        await logout();
      }
    };

    get_user_session();
  }, []);

  const value: UserState = { user, setUser };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useState(): UserState {
  const context = React.useContext<UserState | null>(UserContext);
  ok(context, Error("Cannot determine user."));
  return context;
}
