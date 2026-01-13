import AWS from 'aws-sdk';

const s3 = new AWS.S3({ region: process.env.AWS_REGION });

export async function getSignedUrlPromise(Key, opts = {}) {
  const params = {
    Bucket: opts.Bucket || process.env.S3_BUCKET,
    Key,
    Expires: opts.expiresIn || 60,
    // Allow specifying a forced content-disposition (filename)
    ResponseContentDisposition: opts.contentDisposition || `attachment; filename="${(opts.filename || Key.split('/').pop())}"`
  };

  return s3.getSignedUrlPromise('getObject', params);
}