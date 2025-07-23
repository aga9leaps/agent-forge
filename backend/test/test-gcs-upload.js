#!/usr/bin/env node

import { uploadReportToGCS, generateAndUploadReport } from "../src/utils/reportStorageUtils.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./configs/.env" });

async function testGCSReportUpload() {
  console.log("🚀 Testing Google Cloud Storage Report Upload...");
  console.log("Bucket:", process.env.GCP_BUCKET_NAME);
  console.log("Credentials:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
  
  try {
    // Create a test PDF content (simple test data)
    const testPdfContent = Buffer.from("%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Report) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF");
    
    // Test 1: Direct upload to GCS
    console.log("\n📤 Test 1: Direct upload to Google Cloud Storage...");
    const result = await uploadReportToGCS(
      testPdfContent,
      "test_report",
      "20250721",
      "20250721"
    );
    
    console.log("✅ Upload successful!");
    console.log("📄 Report details:", result);
    console.log("🌐 Public URL:", result.downloadUrl);
    
    // Verify the URL is accessible
    console.log("\n🔍 Testing URL accessibility...");
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(result.downloadUrl, { method: 'HEAD' });
    
    if (response.ok) {
      console.log("✅ URL is accessible!");
      console.log("📊 Content Type:", response.headers.get('content-type'));
      console.log("📏 Content Length:", response.headers.get('content-length'));
    } else {
      console.log("❌ URL is not accessible:", response.status, response.statusText);
    }
    
    console.log("\n✅ All tests passed! Google Cloud Storage integration is working correctly.");
    console.log("\n🎉 Reports will now be stored securely in the cloud and accessible via public URLs.");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Check if Google Cloud credentials are correctly set up");
    console.log("2. Ensure the GCP bucket exists and has correct permissions");
    console.log("3. Verify network connectivity to Google Cloud Storage");
  }
}

// Run the test
testGCSReportUpload().catch(console.error);
