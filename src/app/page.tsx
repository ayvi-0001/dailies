import * as React from "react";

import UserProvider from "@/app/providers/user";
import { DailyList } from "@/components/daily";

export default async function Page(_props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<React.ReactElement> {
  return (
    <UserProvider>
      <DailyList title="Dailies" />
    </UserProvider>
  );
}

export async function generateMetadata(_: {
  params: Promise<{ slug: string }>;
}): Promise<{ title: string }> {
  return { title: `Dailies` };
}
