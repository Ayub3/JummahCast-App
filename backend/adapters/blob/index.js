import { createLocalBlob } from "./local.js";
import { createS3Blob } from "./s3.js";

export function createBlobAdapter(config) {
  if (config.BLOB_DRIVER === "s3") return createS3Blob(config);
  return createLocalBlob(config);
}

export default { createBlobAdapter };