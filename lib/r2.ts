import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? ""}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "",
  },
  forcePathStyle: true, // Cloudflare R2 memerlukan path-style URLs
});

export async function uploadToR2(
  fileBuffer: Buffer,
  mimeType: string,
  folder = "pencairan",
): Promise<string> {
  const ext = mimeType.split("/")[1] || "jpg";
  const key = `${folder}/${randomUUID()}.${ext}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "",
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    }),
  );

  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}
