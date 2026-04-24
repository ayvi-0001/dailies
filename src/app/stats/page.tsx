import * as React from "react";

import type { Metadata, ResolvingMetadata } from "next";

import NavBar from "@/app/navbar";
import type { PageProps } from "@/types/props";

import UserProvider from "../providers/user";
import App from "./chart";

export default async function Page(_: PageProps): Promise<React.ReactElement> {
  return (
    <>
      <div className="absolute inset-0 my-15 flex items-center justify-center">
        <UserProvider>
          <App />
        </UserProvider>
      </div>
      <React.Suspense>
        <NavBar />
      </React.Suspense>
    </>
  );
}

export async function generateMetadata(_1: PageProps, _2: ResolvingMetadata): Promise<Metadata> {
  return {} as Metadata;
}
