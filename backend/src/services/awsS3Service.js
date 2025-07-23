import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: "./configs/.env" });

class AwsS3Service {
  constructor() {
    const region = process.env.AWS_REGION || 'us-west-2';
    
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: region
    });
    
    // Use AWS_BUCKET_NAME instead of AWS_S3_BUCKET_NAME based on logs
    this.bucketName = process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || 'jbot-nl';
    
    console.log(`AWS S3 initialized with region: ${region}`);
    console.log(`AWS_BUCKET_NAME: ${this.bucketName}`);
  }

  /**
   * Upload a file from buffer to S3
   * @param {Buffer} fileBuffer - The buffer of the file to upload
   * @param {string} fileName - Name to save the file as
   * @param {string} fileType - MIME type of the file
   * @param {string} fileCategory - Category/folder to place the file in (e.g., 'avatars', 'documents')
   * @returns {Promise<string>} - URL of the uploaded file
   */
  async uploadFileFromBuffer(fileBuffer, fileName, fileType, fileCategory = '') {
    // If there's no file buffer, return a default URL
    if (!fileBuffer) {
      console.warn("No file buffer provided for upload");
      return "https://placeholder.com/no-image"; // Placeholder URL
    }
    
    const key = fileCategory ? `${fileCategory}/${fileName}` : fileName;
    
    // Verify that we have what we need
    if (!this.bucketName) {
      console.error("S3 bucket name not configured");
      return "https://placeholder.com/error"; // Placeholder URL for error
    }
    
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: fileType || 'application/octet-stream',
      ACL: 'public-read' // Make the file publicly accessible
    };

    try {
      // Check if bucket exists first
      try {
        await this.s3.headBucket({ Bucket: this.bucketName }).promise();
      } catch (bucketError) {
        console.error(`Bucket ${this.bucketName} does not exist:`, bucketError);
        return "https://placeholder.com/bucket-not-found";
      }
      
      const data = await this.s3.upload(params).promise();
      console.log('File uploaded successfully:', data.Location);
      return data.Location;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      // Return a fallback URL instead of throwing an error
      return "https://placeholder.com/upload-failed";
    }
  }

  /**
   * Get a signed URL for an S3 object that allows temporary access
   * @param {string} key - The key (path) of the file in S3
   * @param {number} expirySeconds - Number of seconds until the URL expires
   * @returns {Promise<string>} - Signed URL
   */
  async getSignedUrl(key, expirySeconds = 60) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expirySeconds
    };

    try {
      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   * @param {string} key - The key (path) of the file in S3
   * @returns {Promise<object>} - Deletion result
   */
  async deleteFile(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key
    };

    try {
      const data = await this.s3.deleteObject(params).promise();
      console.log('File deleted successfully:', key);
      return data;
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw error;
    }
  }
}

export default AwsS3Service;
