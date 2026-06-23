import * as React from "react";

export default function ComponentList({
  elements,
  separator,
}: {
  elements: React.ReactElement[];
  separator?: React.ReactElement;
}): React.ReactElement[] {
  return elements.map((item, index, arr) => (
    <React.Fragment key={item.key || index}>
      {index < arr.length && index >= 1 && (separator ?? <></>)}
      {item}
    </React.Fragment>
  ));
}
