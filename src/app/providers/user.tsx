"use client";

import * as React from "react";

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

export default function UserProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  const [user, setUser] = React.useState<Option<User>>(null);

  React.useEffect(() => {
    const get_session = async () => {
      try {
        await getSession().then(result => setUser(result));
      } catch (err: unknown) {
        console.log(err);
        toast.error(`${err}`);
        await logout();
      }
    };
    get_session();
  }, []);

  if (!user) return <></>;
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export function useState<
  State = { user: User; setUser: React.Dispatch<React.SetStateAction<User>> },
>(): State {
  const context = React.useContext<Option<UserState>>(UserContext);
  ok(context, new Error("User state was used outside of its Provider"));
  return context as State;
}
