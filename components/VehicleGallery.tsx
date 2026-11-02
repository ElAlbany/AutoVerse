"use client";
import { useState } from "react";
import VehicleImage from "./VehicleImage";
import type { GalleryImage } from "@/lib/car-media";
export default function VehicleGallery({
  images,
  name,
  actual,
}: {
  images: GalleryImage[];
  name: string;
  actual: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] || images[0];
  return (
    <div className="av-gallery">
      <div className="av-detail-photo">
        <VehicleImage
          key={current.src}
          src={current.src}
          alt={`${name} · ${current.label}`}
          priority
          sizes="(max-width:760px) 100vw, 60vw"
        />
      </div>
      <div className="av-gallery-thumbs" aria-label="Vehicle views">
        {images.map((item, i) => (
          <button
            type="button"
            key={item.src}
            onClick={() => setSelected(i)}
            aria-pressed={selected === i}
            aria-label={`Show ${item.label}`}
          >
            <span className="av-gallery-thumb">
              <VehicleImage src={item.src} alt="" sizes="120px" />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <p className="av-muted">
        {actual
          ? "Vehicle photographs supplied by the rental operator."
          : "Model illustrations supplied by IMAGIN.studio. Trim, colour and equipment may differ from the rental vehicle."}
      </p>
    </div>
  );
}
