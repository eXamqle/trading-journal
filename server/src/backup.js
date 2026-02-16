import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../database/trading-journal.db');
const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.S3_REGION || 'us-east-1';
const PREFIX = 'backups/';
const RETENTION_DAYS = 14;

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function upload() {
  const date = new Date().toISOString().split('T')[0];
  const key = `${PREFIX}trading-journal-${date}.db`;
  const body = readFileSync(DB_PATH);

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
  }));

  console.log(`Uploaded ${key} (${(body.length / 1024).toFixed(1)} KB)`);
}

async function deleteOld() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const { Contents } = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: PREFIX,
  }));

  if (!Contents || Contents.length === 0) return;

  const toDelete = Contents.filter((obj) => obj.LastModified < cutoff);
  if (toDelete.length === 0) {
    console.log('No old backups to delete');
    return;
  }

  await s3.send(new DeleteObjectsCommand({
    Bucket: BUCKET,
    Delete: { Objects: toDelete.map((obj) => ({ Key: obj.Key })) },
  }));

  console.log(`Deleted ${toDelete.length} backup(s) older than ${RETENTION_DAYS} days`);
}

try {
  await upload();
  await deleteOld();
  console.log('Backup complete');
} catch (err) {
  console.error('Backup failed:', err.message);
  process.exit(1);
}
