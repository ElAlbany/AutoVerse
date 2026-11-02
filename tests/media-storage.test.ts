import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, unlink, rmdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  mediaStorageInfo,
  readVehicleImage,
  storeVehicleImage,
} from "../lib/media-storage";
test("local upload storage round trips immutable files and rejects path traversal", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "autoverse-media-test-"),
  );
  const names = [
    "S3_ENDPOINT",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_BUCKET",
    "S3_PUBLIC_URL",
    "UPLOAD_DIR",
    "VERCEL",
  ];
  const previous = names.map((name) => process.env[name]);
  names.forEach((name) => delete process.env[name]);
  process.env.UPLOAD_DIR = directory;
  let key = "";
  try {
    assert.equal(mediaStorageInfo().provider, "disk");
    const input = new Uint8Array([1, 2, 3]);
    const url = await storeVehicleImage(input);
    key = url.split("/").at(-1)!;
    assert.ok(url.startsWith("/api/media/"));
    assert.deepEqual(await readVehicleImage(key), Buffer.from(input));
    assert.equal(await readVehicleImage("../../.env"), null);
    process.env.S3_ENDPOINT = "https://example.test";
    assert.throws(() => mediaStorageInfo(), /partly configured/);
  } finally {
    names.forEach((name, i) => {
      if (previous[i] === undefined) delete process.env[name];
      else process.env[name] = previous[i];
    });
    if (key) await unlink(path.join(directory, key));
    await rmdir(directory);
  }
});
