import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.AWS_DEFAULT_REGION || "us-east-1",
      endpoint: process.env.AWS_ENDPOINT_URL,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }
  return _client;
}

function getBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) throw new Error("AWS_S3_BUCKET_NAME is required");
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

export async function getFromS3(key: string) {
  const res = await getS3Client().send(
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
  return res;
}

export function getPublicUrl(key: string): string {
  // Proxy through our API since Railway Object Storage is private-only
  return `/api/images/${key}`;
}

export function extractKeyFromUrl(url: string): string | null {
  // Handle proxy URLs: /api/images/{key}
  const proxyPrefix = "/api/images/";
  if (url.startsWith(proxyPrefix)) return url.slice(proxyPrefix.length);

  // Handle legacy direct S3 URLs
  const endpoint = process.env.AWS_ENDPOINT_URL;
  const bucket = getBucket();
  if (!endpoint) return null;
  const prefix = `${endpoint.replace(/\/$/, "")}/${bucket}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}
