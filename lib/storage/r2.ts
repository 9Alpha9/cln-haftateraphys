import { AwsClient } from 'aws4fetch';

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

function readConfig(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

export function isR2Configured() {
  return readConfig() !== null;
}

function getClient() {
  const config = readConfig();
  if (!config) throw new Error('Penyimpanan dokumen belum dikonfigurasi.');
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
  });
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
  return { client, config, endpoint };
}

export async function uploadObject(params: {
  key: string;
  body: ArrayBuffer;
  contentType: string;
}) {
  const { client, config, endpoint } = getClient();
  const url = `${endpoint}/${config.bucket}/${params.key}`;
  const response = await client.fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': params.contentType },
    body: params.body,
  });
  if (!response.ok) {
    throw new Error(`Gagal mengunggah dokumen (${response.status}).`);
  }
}

export async function getObject(key: string) {
  const { client, config, endpoint } = getClient();
  const url = `${endpoint}/${config.bucket}/${key}`;
  const response = await client.fetch(url, { method: 'GET' });
  if (!response.ok || !response.body) {
    throw new Error(`Dokumen tidak dapat diambil (${response.status}).`);
  }
  return response;
}

export async function deleteObject(key: string) {
  try {
    const { client, config, endpoint } = getClient();
    const url = `${endpoint}/${config.bucket}/${key}`;
    await client.fetch(url, { method: 'DELETE' });
  } catch {
    // Best-effort cleanup; never block the main flow.
  }
}
