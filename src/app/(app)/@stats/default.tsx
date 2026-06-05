import * as React from "react";

import Speeddial from "@/app/(app)/@quests/speed-dial";

import App from "./chart";

export default function Default(): React.ReactElement {
  return (
    <>
      <div className="absolute inset-0 my-15 flex items-center justify-center">
        <App />
      </div>
      <React.Suspense>
        <Speeddial />
      </React.Suspense>
    </>
  );
}
