"use client";
import { useEffect, useState } from "react";
import { validCarImageUrl } from "@/lib/car-media";
import VehicleImage from "../VehicleImage";
export default function CarMediaEditor({
  initialImages = [],
  initialSource = "API",
  onBusy,
}: {
  initialImages?: string[];
  initialSource?: string;
  onBusy: (busy: boolean) => void;
}) {
  const [hosted, setHosted] = useState("");
  const [source, setSource] = useState(initialSource);
  const [images, setImages] = useState(
    initialImages.filter((src) => !src.includes("imagin.studio")),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [storage, setStorage] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/media", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!controller.signal.aborted) {
          setStorage(data.message || data.error);
          setReady(response.ok);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setStorage("Photo storage could not be checked. Try again later.");
      });
    return () => controller.abort();
  }, []);
  return (
    <div className="space-y-4">
      <fieldset className="flex flex-wrap gap-5">
        <legend className="mb-3">Listing imagery</legend>
        {[
          { value: "API", label: "Model illustrations · API" },
          { value: "UPLOADED", label: "Real vehicle photos" },
        ].map((option) => (
          <label className="flex gap-2" key={option.value}>
            <input
              type="radio"
              name="imageSource"
              value={option.value}
              checked={source === option.value}
              onChange={() => setSource(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <input type="hidden" name="images" value={images.join("\n")} />
      {source === "API" ? (
        <p className="av-muted">
          Front, side and rear illustrations are requested from IMAGIN.studio
          using the make, model and year. A customer key may be needed; confirm
          the provider's commercial licence before selling a deployment.
        </p>
      ) : (
        <>
          <p className="av-muted">
            Upload up to 12 photos of this vehicle. The first image is the
            cover. JPEG, PNG or WebP, up to 3 MB each. Photos are compressed and
            location metadata is removed.
          </p>
          <p className="av-muted" role="status">
            {storage || "Checking photo storage…"}
          </p>
          <label className="av-field">
            Upload photographs
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={busy || !ready || images.length >= 12}
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = "";
                if (images.length + files.length > 12) {
                  setMessage("Choose at most 12 photos in total.");
                  return;
                }
                setBusy(true);
                onBusy(true);
                setMessage("");
                let uploaded = 0;
                try {
                  for (const file of files) {
                    if (file.size > 3 * 1024 * 1024)
                      throw new Error(
                        `${file.name} exceeds 3 MB. Resize it and try again.`,
                      );
                    const form = new FormData();
                    form.set("file", file);
                    const response = await fetch("/api/admin/media", {
                      method: "POST",
                      body: form,
                    });
                    const result = await response.json();
                    if (!response.ok)
                      throw new Error(result.error || "Photo upload failed.");
                    setImages((current) => [...current, result.url]);
                    uploaded++;
                  }
                  setMessage(
                    `${uploaded} photos uploaded. Save the listing to publish them.`,
                  );
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : "Photo upload failed.",
                  );
                } finally {
                  setBusy(false);
                  onBusy(false);
                }
              }}
            />
          </label>
          {busy && (
            <p className="av-muted" role="status">
              Uploading and preparing photographs…
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((src, i) => (
              <div key={`${src}-${i}`} className="av-media-preview">
                <div className="relative aspect-[4/3]">
                  <VehicleImage
                    src={src}
                    alt={`Vehicle photo ${i + 1}`}
                    sizes="200px"
                  />
                </div>
                <div className="flex flex-wrap gap-2 p-2">
                  <button
                    type="button"
                    className="av-text-link"
                    disabled={busy || i === 0}
                    onClick={() =>
                      setImages((current) => [
                        current[i],
                        ...current.filter((_, index) => index !== i),
                      ])
                    }
                  >
                    {i === 0 ? "Cover photo" : "Make cover"}
                  </button>
                  <button
                    type="button"
                    className="av-text-link"
                    disabled={busy}
                    onClick={() =>
                      setImages((current) =>
                        current.filter((_, index) => index !== i),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <details>
            <summary className="av-muted cursor-pointer">
              Use existing hosted photo URLs
            </summary>
            <label className="av-field mt-3">
              One HTTPS URL per line
              <textarea
                rows={4}
                disabled={busy}
                value={hosted}
                onChange={(e) => setHosted(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="av-button av-button-small mt-3"
              disabled={busy}
              onClick={() => {
                const urls = hosted
                  .split(/\r?\n/)
                  .map((v) => v.trim())
                  .filter(Boolean);
                if (
                  !urls.length ||
                  urls.some((src) => !validCarImageUrl(src)) ||
                  images.length + urls.length > 12
                ) {
                  setMessage(
                    "Add valid HTTPS photo URLs, up to 12 photos in total.",
                  );
                  return;
                }
                setImages((current) => [...current, ...urls]);
                setHosted("");
                setMessage("Photos added. Save the listing to publish them.");
              }}
            >
              Add hosted photos
            </button>
          </details>
          <p className="av-muted">
            Removing a photo here removes it from this listing when saved.
            Storage files remain available for other references and can be
            cleaned up by the storage administrator.
          </p>
        </>
      )}
      {message && (
        <p className="av-alert" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
