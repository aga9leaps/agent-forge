import AWS from "aws-sdk";
import fs from "fs";
import axios from "axios";

export async function downloadFile(url, localPath) {
  if (url.includes("amazonaws.com")) {
    // S3 URL
    const { Bucket, Key } = parseS3Url(url);
    const s3 = new AWS.S3();
    const file = fs.createWriteStream(localPath);
    return new Promise((resolve, reject) => {
      s3.getObject({ Bucket, Key })
        .createReadStream()
        .on("end", resolve)
        .on("error", reject)
        .pipe(file);
    });
  } else {
    // Local API or other HTTP URL
    const response = await axios.get(url, { responseType: "stream" });
    const file = fs.createWriteStream(localPath);
    return new Promise((resolve, reject) => {
      response.data.pipe(file);
      file.on("finish", resolve);
      file.on("error", reject);
    });
  }
}

function parseS3Url(url) {
  const match = url.match(/^https:\/\/([^.]+)\.s3[.-][^/]+\.amazonaws\.com\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid S3 URL: ${url}`);
  }
  return { Bucket: match[1], Key: match[2] };
}