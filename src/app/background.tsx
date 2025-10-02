import Image from "next/image";
import React from "react";

interface BackgroundProps {
  src: string;
  alt: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// TODO(ayvi): parallax background
const FullScreenBackground = ({
  src,
  alt,
  children,
  className,
  style,
}: BackgroundProps): React.ReactNode => {
  const image = (
    <Image
      src={src}
      alt={alt}
      quality={100} // Adjust quality as needed
      fill // Makes the image fill the parent container
      className={className}
      style={{ ...style, objectFit: "cover" }} // Ensures the image covers the entire area without distortion
      priority // Preload the image if it's a critical background
    />
  );

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z--2">
      {image}
      {children}
    </div>
  );
};

export default FullScreenBackground;
