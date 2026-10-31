import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
function storageConfig() {
  const names = [
    "S3_ENDPOINT",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_BUCKET",
    "S3_PUBLIC_URL",
  ];
  const count = names.filter((name) => process.env[name]).length;
  if (count && count !== names.length)
    throw new Error(
      "Photo storage is partly configured. Complete all five S3 settings.",
    );
  if (count) {
    if (
      !process.env.S3_ENDPOINT!.startsWith("https://") ||
      !process.env.S3_PUBLIC_URL!.startsWith("https://")
    )
      throw new Error("Photo storage requires HTTPS endpoints.");
    return "s3" as const;
  }
  if (
    process.env.VERCEL ||
    (process.env.NODE_ENV === "production" && !process.env.UPLOAD_DIR)
  )
    throw new Error(
      "Configure persistent object storage, or UPLOAD_DIR on a server with a persistent disk, to upload real photographs.",
    );
  return "disk" as const;
}
export function localMediaDirectory() {
  const directory = path.resolve(
    /* turbopackIgnore: true */ process.env.UPLOAD_DIR ||
      path.join(process.cwd(), ".uploads"),
  );
  const publicDir = path.resolve(process.cwd(), "public");
  if (directory === publicDir || directory.startsWith(publicDir + path.sep))
    throw new Error("Use a persistent upload directory outside public.");
  return directory;
}
export function mediaStorageInfo() {
  const provider = storageConfig();
  return {
    provider,
    message:
      provider === "s3"
        ? "Object storage connected. Photos persist across deployments."
        : process.env.NODE_ENV === "production"
          ? "Server disk configured. Back up and persist this directory across deployments."
          : "Development disk storage. Configure object storage before serverless deployment.",
  };
}
export async function storeVehicleImage(bytes: Uint8Array) {
  const key = `${randomUUID()}.webp`;
  if (storageConfig() === "s3") {
    const client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT!,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: `vehicles/${key}`,
        Body: bytes,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${process.env.S3_PUBLIC_URL!.replace(/\/$/, "")}/vehicles/${key}`;
  }
  const directory = localMediaDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, key), bytes, { flag: "wx" });
  return `/api/media/${key}`;
}
export async function readVehicleImage(key: string) {
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/.test(
      key,
    )
  )
    return null;
  try {
    // Runtime uploads live outside the deployment bundle, on a mounted disk.
    return await readFile(
      /* turbopackIgnore: true */ path.join(
        /* turbopackIgnore: true */ localMediaDirectory(),
        key,
      ),
    );
  } catch {
    return null;
  }
}
