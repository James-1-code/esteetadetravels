const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const wasabiConfig = {
  region: process.env.WASABI_REGION || 'eu-west-3',
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY,
    secretAccessKey: process.env.WASABI_SECRET_KEY,
  },
  endpoint: `https://s3.${process.env.WASABI_REGION || 'eu-west-3'}.wasabisys.com`,
  forcePathStyle: true,
};

const s3Client = new S3Client(wasabiConfig);
const BUCKET_NAME = process.env.WASABI_BUCKET || 'esteetade-uploads';

const uploadFile = async (fileBuffer, fileName, contentType) => {
  const key = `uploads/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });
  await s3Client.send(command);
  return { key, url: `https://${BUCKET_NAME}.s3.${process.env.WASABI_REGION}.wasabisys.com/${key}` };
};

const getSignedDownloadUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  return await getSignedUrl(s3Client, command, { expiresIn });
};

const getFileUrl = (key) => `https://${BUCKET_NAME}.s3.${process.env.WASABI_REGION}.wasabisys.com/${key}`;

const deleteFile = async (key) => {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
};

module.exports = { s3Client, uploadFile, getSignedDownloadUrl, getFileUrl, deleteFile, BUCKET_NAME };
