import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import https from "https";
dotenv.config({ path: "../configs/.env" });
AWS.config.update({
  httpOptions: { agent: new https.Agent({ rejectUnauthorized: false }) },
});

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
console.log("AWS S3 initialized with region:", process.env.AWS_REGION);
console.log("AWS_BUCKET_NAME:", process.env.TALLY_AWS_BUCKET_NAME);
// Function to download a file from S3
export async function downloadFileFromS3(s3Key, localFilePath) {
  const params = {
    Bucket: process.env.TALLY_AWS_BUCKET_NAME,
    Key: s3Key,
  };

  try {
    const data = await s3.getObject(params).promise();
    fs.writeFileSync(localFilePath, data.Body);
    console.log(`✅ Downloaded ${s3Key} to ${localFilePath}`);
  } catch (err) {
    console.error(`❌ Failed to download ${s3Key}:`, err);
  }
}

// Function to upload a file to S3
// export async function uploadFileToS3(content, s3Key) {
//   const params = {
//     Bucket: process.env.TALLY_AWS_BUCKET_NAME,
//     Key: s3Key,
//     Body: typeof content === "string" ? content : fs.readFileSync(content),
//     ContentType: "text/csv",
//   };

//   try {
//     await s3.upload(params).promise();
//     console.log(`✅ Uploaded ${s3Key} to S3.`);
//   } catch (err) {
//     console.error(`❌ Failed to upload ${s3Key}:`, err);
//   }
// }
export async function uploadFileToS3(content, s3Key, contentType = "application/pdf") {
  const params = {
    Bucket: process.env.TALLY_AWS_BUCKET_NAME,
    Key: s3Key,
    Body: content,
    ContentType: contentType,
  };

  try {
    await s3.upload(params).promise();
    console.log(`✅ Uploaded ${s3Key} to S3.`);
  } catch (err) {
    console.error(`❌ Failed to upload ${s3Key}:`, err);
  }
}