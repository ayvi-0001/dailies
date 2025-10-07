import React from "react";

import Image from "next/image";

import { cn } from "@/lib/utils";

type BackgroundProps = {
  src: string;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
  props?: React.ComponentProps<"div">;
  imageProps?: React.ComponentProps<typeof Image>;
  children?: React.ReactNode;
};

// TODO(ayvi): parallax background + rotate selection
// http://ayvi:3000/ayvi/dailies/issues/25
export default function BackgroundImage(background_props: BackgroundProps): React.ReactElement {
  let { src, alt, style, className, props, imageProps, children } = background_props;

  return (
    <div className={cn("fixed top-0 left-0 w-screen h-screen z--2", className)} {...props}>
      <Image
        alt={alt ?? ""}
        fill
        priority
        quality={100}
        src={src}
        style={{ ...style, objectFit: "cover" }}
        {...imageProps}
      />
      {children}
    </div>
  );
}
