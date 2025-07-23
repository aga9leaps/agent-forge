import { googleCloudStorageService } from "../serviceConfigs/GoogleCloudStorageService.js";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Upload a report file to Google Cloud Storage and return public URL
 * @param {string|Buffer} reportData - Path to report file or Buffer containing report data
 * @param {string} reportType - Type of report (profit_loss, cash_flow_statement, etc.)
 * @param {string} fromDate - Start date for the report
 * @param {string} toDate - End date for the report
 * @returns {Promise<{downloadUrl: string, fileName: string}>}
 */
export async function uploadReportToGCS(reportData, reportType, fromDate, toDate) {
  try {
    // Generate a meaningful filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const reportId = uuidv4().split('-')[0]; // Use first part of UUID for shorter ID
    const fileName = `reports/${reportType}/${timestamp}_${reportId}_${reportType}_${fromDate}_${toDate}.pdf`;
    
    console.log(`📤 Uploading report to Google Cloud Storage: ${fileName}`);
    
    // Upload to Google Cloud Storage
    const publicUrl = await googleCloudStorageService.uploadFile(
      reportData,
      fileName,
      'application/pdf'
    );
    
    console.log(`✅ Report uploaded successfully: ${publicUrl}`);
    
    return {
      downloadUrl: publicUrl,
      fileName: fileName,
      reportType: reportType,
      dateRange: `${fromDate}_${toDate}`,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error uploading report to Google Cloud Storage:', error);
    throw new Error(`Failed to upload report: ${error.message}`);
  }
}

/**
 * Enhanced report generation wrapper that handles GCS upload
 * @param {Function} reportGeneratorFn - Function that generates the report (returns local path or buffer)
 * @param {string} reportType - Type of report
 * @param {string} fromDate - Start date
 * @param {string} toDate - End date
 * @returns {Promise<{downloadUrl: string, fileName: string}>}
 */
export async function generateAndUploadReport(reportGeneratorFn, reportType, fromDate, toDate) {
  try {
    console.log(`🚀 Generating and uploading ${reportType} report...`);
    
    // Generate the report (this returns local path or buffer)
    const reportResult = await reportGeneratorFn(fromDate, toDate);
    
    let reportData;
    
    // Handle different response formats from existing report generators
    if (typeof reportResult === 'string' && fs.existsSync(reportResult)) {
      // If it's a file path
      reportData = reportResult;
    } else if (reportResult && reportResult.filePath && fs.existsSync(reportResult.filePath)) {
      // If it's an object with filePath property
      reportData = reportResult.filePath;
    } else if (reportResult && reportResult.buffer) {
      // If it's an object with buffer property
      reportData = reportResult.buffer;
    } else if (Buffer.isBuffer(reportResult)) {
      // If it's directly a buffer
      reportData = reportResult;
    } else if (reportResult && reportResult.downloadUrl) {
      // If the existing function already uploaded somewhere, we'll re-upload to GCS
      console.log(`📥 Existing report found at: ${reportResult.downloadUrl}`);
      console.log(`🔄 Re-uploading to Google Cloud Storage for public access...`);
      
      // Download the existing file and re-upload to GCS
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(reportResult.downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download existing report: ${response.statusText}`);
      }
      reportData = Buffer.from(await response.arrayBuffer());
    } else {
      console.error('Unknown report result format:', reportResult);
      throw new Error('Invalid report result format - cannot determine how to extract report data');
    }
    
    // Upload to Google Cloud Storage
    const gcsResult = await uploadReportToGCS(reportData, reportType, fromDate, toDate);
    
    // Clean up local file if it exists
    if (typeof reportData === 'string' && fs.existsSync(reportData)) {
      try {
        fs.unlinkSync(reportData);
        console.log(`🗑️ Cleaned up local file: ${reportData}`);
      } catch (cleanupError) {
        console.warn(`⚠️ Could not clean up local file: ${cleanupError.message}`);
      }
    }
    
    return gcsResult;
  } catch (error) {
    console.error(`❌ Error in generateAndUploadReport for ${reportType}:`, error);
    throw error;
  }
}

/**
 * Generate a unique report identifier
 * @param {string} reportType - Type of report
 * @param {string} fromDate - Start date
 * @param {string} toDate - End date
 * @returns {string} - Unique report identifier
 */
export function generateReportId(reportType, fromDate, toDate) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  return `${reportType}_${fromDate}_${toDate}_${timestamp}_${randomId}`;
}

/**
 * Get report metadata from filename
 * @param {string} fileName - GCS file name
 * @returns {object} - Parsed metadata
 */
export function parseReportMetadata(fileName) {
  try {
    const parts = path.basename(fileName, '.pdf').split('_');
    return {
      date: parts[0],
      reportId: parts[1],
      reportType: parts[2],
      fromDate: parts[3],
      toDate: parts[4]
    };
  } catch (error) {
    console.warn('Could not parse report metadata from filename:', fileName);
    return null;
  }
}

/**
 * Generate a presigned URL for temporary access (if needed for security)
 * @param {string} fileName - GCS file name
 * @param {number} expiresInHours - Expiration time in hours (default 24)
 * @returns {Promise<string>} - Presigned URL
 */
export async function generatePresignedUrl(fileName, expiresInHours = 24) {
  try {
    const url = await googleCloudStorageService.getSignedUrl(fileName, expiresInHours * 60);
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}
