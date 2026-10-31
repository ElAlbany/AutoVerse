"use client";
import Image from "next/image";
import { useState } from "react";

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
  return (
    <Image
      src={failed ? "/vehicle-placeholder.svg" : src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={
        src.includes("placeholder") || failed
          ? "object-contain p-8"
          : "object-cover"
      }
      onError={() => setFailed(true)}
    />
  );
}
