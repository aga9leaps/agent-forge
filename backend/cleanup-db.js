#!/usr/bin/env node

// Database cleanup script for Reporting Agent
// This script fixes any invalid JSON data in the emails columns

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ReportingAgentDB from './src/models/reportingAgentModel.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'configs', '.env') });

async function runCleanup() {
  console.log('🧹 Starting Reporting Agent database cleanup...');
  
  try {
    const reportingDB = new ReportingAgentDB();
    
    // Test connection first
    const isConnected = await reportingDB.testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed. Please check your configuration.');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
    
    // Run the cleanup
    await reportingDB.cleanupInvalidJsonData();
    
    console.log('✅ Database cleanup completed successfully!');
    console.log('📋 Summary: Fixed any invalid JSON data in emails columns');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the cleanup
runCleanup();
