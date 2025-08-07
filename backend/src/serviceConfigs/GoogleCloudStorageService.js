import { Storage } from "@google-cloud/storage";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import https from "https";

dotenv.config({ path: "../../configs/.env" });

class GoogleCloudStorageService {
  #storage = null;
  #bucketName = null;
  #serviceAccountPath = null;
  #credentials = null;

  constructor() {
    this.#serviceAccountPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS;
    this.#bucketName = process.env.GCP_BUCKET_NAME || "invoice-api-bucket";
    
    // Build credentials object from environment variables
    this.#credentials = {
      type: process.env.GCS_TYPE || "service_account",
      project_id: process.env.GCS_PROJECT_ID,
      private_key_id: process.env.GCS_PRIVATE_KEY_ID,
      private_key: process.env.GCS_PRIVATE_KEY ? process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n') : null,
      client_email: process.env.GCS_CLIENT_EMAIL,
      client_id: process.env.GCS_CLIENT_ID,
      auth_uri: process.env.GCS_AUTH_URI,
      token_uri: process.env.GCS_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GCS_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GCS_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GCS_UNIVERSE_DOMAIN
    };
  }

  async getStorageClient() {
    if (!this.#storage) {
      try {
        let storageConfig = {
          // Add HTTP agent with relaxed SSL validation
          httpOptions: {
            agent: new https.Agent({
              rejectUnauthorized: false,
            }),
          },
        };

        // Use credentials object if available, otherwise fall back to keyFilename
        if (this.#credentials && this.#credentials.project_id && this.#credentials.private_key) {
          storageConfig.credentials = this.#credentials;
          storageConfig.projectId = this.#credentials.project_id;
          console.log("Using GCS credentials from environment variables");
        } else if (this.#serviceAccountPath) {
          storageConfig.keyFilename = this.#serviceAccountPath;
          console.log("Using GCS credentials from key file:", this.#serviceAccountPath);
        } else {
          throw new Error("Neither GCS credentials nor GOOGLE_APPLICATION_CREDENTIALS are properly configured");
        }

        // Initialize storage with the configuration
        this.#storage = new Storage(storageConfig);

        // Check if the bucket exists, if not create it
        await this.ensureBucketExists();
      } catch (error) {
        console.error("Error initializing Google Cloud Storage client:", error);
        throw error;
      }
    }
    return this.#storage;
  }

  async ensureBucketExists() {
    try {
      const [buckets] = await this.#storage.getBuckets();
      const bucketExists = buckets.some(
        (bucket) => bucket.name === this.#bucketName
      );

      if (!bucketExists) {
        console.log(`Bucket ${this.#bucketName} does not exist. Creating...`);
        await this.#storage.createBucket(this.#bucketName);
        console.log(`Bucket ${this.#bucketName} created.`);
      }
    } catch (error) {
      console.error("Error checking/creating bucket:", error);
      throw error;
    }
  }

  /**
   * Uploads a file to Google Cloud Storage
   * @param {string|Buffer} fileData - Path to file or Buffer containing file data
   * @param {string} fileName - Name to save the file as (optional, will generate if not provided)
   * @param {string} fileType - MIME type of the file (e.g., 'application/pdf', 'image/jpeg')
   * @returns {Promise<string>} - URL of the uploaded file
   */
  async uploadFile(fileData, fileName = null, fileType = "application/pdf") {
    try {
      const storage = await this.getStorageClient();
      const bucket = storage.bucket(this.#bucketName);

      // Generate a filename using UUID for consistent naming if not provided
      if (!fileName) {
        const fileExtension =
          fileType === "application/pdf"
            ? ".pdf"
            : fileType === "image/jpeg"
            ? ".jpg"
            : fileType === "image/png"
            ? ".png"
            : ".file";
        fileName = `${uuidv4()}${fileExtension}`;
      } else {
        // If filename is provided but doesn't use UUID format,
        // extract the extension and create a new UUID-based filename
        const fileExtension = path.extname(fileName);
        if (!fileName.includes("-") || fileName.split("-")[0].length !== 36) {
          fileName = `${uuidv4()}${fileExtension}`;
        }
      }

      let fileBuffer;

      // Check if fileData is a path or a buffer
      if (typeof fileData === "string" && fs.existsSync(fileData)) {
        fileBuffer = fs.readFileSync(fileData);
      } else if (Buffer.isBuffer(fileData)) {
        fileBuffer = fileData;
      } else if (typeof fileData === "string") {
        // Assume it's a base64 string if it's not a file path
        fileBuffer = Buffer.from(fileData, "base64");
      } else {
        throw new Error("Invalid file data provided");
      }

      // Create a file reference
      const file = bucket.file(fileName);

      // Upload the file
      await file.save(fileBuffer, {
        contentType: fileType,
        metadata: {
          contentType: fileType,
        },
      });

      // Make the file publicly accessible (optional, depending on your requirements)
      await file.makePublic();

      // Get the file's URL
      const publicUrl = `https://storage.googleapis.com/${
        this.#bucketName
      }/${fileName}`;

      console.log(`File uploaded to ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error("Error uploading file to Google Cloud Storage:", error);
      throw error;
    }
  }

  /**
   * Get a signed URL for temporary access to a file
   * @param {string} fileName - The name of the file in storage
   * @param {number} expiresInMinutes - How long the URL should be valid for (in minutes)
   * @returns {Promise<string>} - Signed URL for the file
   */
  async getSignedUrl(fileName, expiresInMinutes = 60) {
    try {
      const storage = await this.getStorageClient();
      const bucket = storage.bucket(this.#bucketName);
      const file = bucket.file(fileName);

      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + expiresInMinutes * 60 * 1000,
      });

      return url;
    } catch (error) {
      console.error("Error generating signed URL:", error);
      throw error;
    }
  }

  /**
   * Delete a file from Google Cloud Storage
   * @param {string} fileName - Name of file to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(fileName) {
    try {
      const storage = await this.getStorageClient();
      const bucket = storage.bucket(this.#bucketName);
      const file = bucket.file(fileName);

      await file.delete();
      console.log(`File ${fileName} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting file ${fileName}:`, error);
      throw error;
    }
  }
}

export const googleCloudStorageService = new GoogleCloudStorageService();
