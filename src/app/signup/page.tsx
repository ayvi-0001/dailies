import * as React from "react";

import type { Metadata, ResolvingMetadata } from "next";

import type { PageProps } from "@/types/props";

import SignupForm from "./form";

export default async function Page(_: PageProps): Promise<React.ReactElement> {
  return (
    <div className="dark fixed inset-0 flex h-screen items-center justify-center select-none">
      <div className="flex h-full w-full items-center justify-center bg-transparent">
        <SignupForm />
      </div>
    </div>
  );
}

export async function generateMetadata(_1: PageProps, _2: ResolvingMetadata): Promise<Metadata> {
  return {} as Metadata;
}
