import React from "react";

export default function Notes({
  notes,
}: {
  notes: string;
}): React.ReactElement {
  return (
    /* TODO(ayvi): clip notes text if too long http://ayvi:3000/ayvi/dailies/issues/10 */
    <p className="text-black overflow-hidden text-ellipsis">{notes}</p>
  );
}
