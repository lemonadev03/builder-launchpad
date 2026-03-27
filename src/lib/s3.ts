import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }
  return _client;
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is required");
  return bucket;
}

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
) {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteFromS3(key: string) {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
}

export function getPublicUrl(key: string): string {
  const base = process.env.S3_PUBLIC_URL;
  if (!base) throw new Error("S3_PUBLIC_URL is required");
  return `${base.replace(/\/$/, "")}/${key}`;
}

export function extractKeyFromUrl(url: string): string | null {
  const base = process.env.S3_PUBLIC_URL;
  if (!base || !url.startsWith(base)) return null;
  return url.slice(base.replace(/\/$/, "").length + 1);
}
