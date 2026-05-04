import * as React from "react";

import type { Metadata, ResolvingMetadata } from "next";

import type { PageProps } from "@/types/props";

import App from "./dyn";

export default async function Page(_: PageProps): Promise<React.ReactElement> {
  return (
    <React.Suspense>
      <App />
    </React.Suspense>
  );
}

export async function generateMetadata(_1: PageProps, _2: ResolvingMetadata): Promise<Metadata> {
  return {} as Metadata;
}
