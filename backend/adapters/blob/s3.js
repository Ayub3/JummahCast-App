import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function assertS3(config) {
  const missing = [];
  for (const k of ["AWS_REGION", "S3_BUCKET"]) {
    if (!config[k]) missing.push(k);
  }
  if (missing.length) throw new Error(`Missing S3 env vars: ${missing.join(", ")}`);
}

function safeFilename(name) {
  return name.replace(/[^\w.\-]+/g, "_");
}

function buildS3Key({ id, date, originalName }) {
  return `sermons/${date}/${id}-${safeFilename(originalName)}`;
}

export function createS3Blob(config) {
  assertS3(config);

  const s3 = new S3Client({ region: config.AWS_REGION });
  const bucket = config.S3_BUCKET;

  return {
    async putAudio({ id, date, originalName, mimetype, buffer }) {
      const key = buildS3Key({ id, date, originalName });

      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }));

      return { storageKey: key };
    },

    async streamAudio(_req, res, sermon) {
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: bucket, Key: sermon.storageKey }),
        { expiresIn: config.SIGNED_URL_TTL_SECONDS }
      );
      // THIS is the “redirecting”:
      res.redirect(302, url);
    },
  };
}
