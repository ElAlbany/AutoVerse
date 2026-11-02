"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function VehicleImage({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <Image
      src={failed ? "/vehicle-placeholder.svg" : src}
      alt={alt}
      unoptimized={src.includes("cdn.imagin.studio/")}
      fill
      sizes={sizes}
      priority={priority}
      className={
        src.includes("placeholder") || failed
          ? "object-contain p-8"
          : src.includes("imagin.studio")
            ? "object-contain p-2"
            : "object-cover"
      }
      onError={() => setFailed(true)}
    />
  );
}
