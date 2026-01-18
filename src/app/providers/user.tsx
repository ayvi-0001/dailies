"use client";

import * as React from "react";

import { invoke } from "@tauri-apps/api/core";
import ok from "assert";
import { toast } from "sonner";

import logout from "@/actions/logout";
import { decrypt } from "@/lib/session";
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
  user: Option<User>;
  setUser: React.Dispatch<React.SetStateAction<Option<User>>>;
};

const UserContext = React.createContext<Option<UserState>>(null);

export default function UserProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  const [user, setUser] = React.useState<Option<User>>(null);

  React.useEffect(() => {
    const get_session = async () => {
      try {
        const session = await invoke<Option<string>>("get_session");
        const token = await decrypt<DecodedToken>(session);
        const payload = { username: token?.userName };
        await invoke<User>("get_user", payload).then(result => setUser(result));
      } catch (err: unknown) {
        console.log(err);
        toast.error(`${err}`);
        await logout();
      }
    };
    get_session();
  }, []);

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export function useState<
  State = { user: Option<User>; setUser: React.Dispatch<React.SetStateAction<User>> },
>(): State {
  const context = React.useContext<Option<UserState>>(UserContext);
  ok(context, new Error("User state was used outside of its Provider"));
  return context as State;
}
