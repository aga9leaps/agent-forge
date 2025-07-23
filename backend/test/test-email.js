// Email Testing Script for Reporting Agent
// Run this script to test email functionality

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api/reporting-agent';

async function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration...\n');
  
  try {
    const response = await fetch(`${API_BASE}/test-email-config`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Email configuration is valid');
      console.log('📋 Config:', result.config);
    } else {
      console.log('❌ Email configuration failed');
      console.log('📋 Config:', result.config);
      console.log('❌ Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Failed to test email config:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

async function testSendEmail(testEmail = 'test@example.com') {
  console.log(`📧 Testing Email Send to: ${testEmail}...\n`);
  
  try {
    const response = await fetch(`${API_BASE}/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📋 Details:', result.details);
    } else {
      console.log('❌ Test email failed');
      console.log('❌ Error:', result.error);
      console.log('📋 Details:', result.details);
    }
  } catch (error) {
    console.log('❌ Failed to send test email:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

async function checkActiveJobs() {
  console.log('🔍 Checking Active Cron Jobs...\n');
  
  try {
    const response = await fetch(`${API_BASE}/active-jobs`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Active Jobs Status:');
      console.log(`📊 Scheduled Jobs: ${result.data.scheduledJobs.length}`);
      console.log(`📊 Alert Jobs: ${result.data.alertJobs.length}`);
      console.log(`📊 Total Jobs: ${result.data.totalJobs}`);
      console.log(`🕐 Current Time: ${result.data.currentTime}`);
      console.log(`🌍 Timezone: ${result.data.timezone}`);
      
      if (result.data.scheduledJobs.length > 0) {
        console.log('📋 Scheduled Job IDs:', result.data.scheduledJobs);
      }
    } else {
      console.log('❌ Failed to get active jobs');
      console.log('❌ Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Failed to check active jobs:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

async function testScheduleExecution(scheduleId) {
  console.log(`🚀 Testing Schedule Execution for ID: ${scheduleId}...\n`);
  
  try {
    const response = await fetch(`${API_BASE}/test-schedule/${scheduleId}`, {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Schedule execution test completed!');
      console.log('📋 Schedule:', result.schedule);
    } else {
      console.log('❌ Schedule execution test failed');
      console.log('❌ Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Failed to test schedule execution:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

async function getAllSchedules() {
  console.log('📋 Getting All Schedules...\n');
  
  try {
    const response = await fetch(`${API_BASE}/schedules`);
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Found ${result.schedules.length} schedules:`);
      result.schedules.forEach((schedule, index) => {
        console.log(`${index + 1}. ID: ${schedule.id} | Type: ${schedule.reportType} | Active: ${schedule.isActive} | Emails: ${schedule.emails.join(', ')}`);
      });
    } else {
      console.log('❌ Failed to get schedules');
      console.log('❌ Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Failed to get schedules:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Email Testing for Reporting Agent\n');
  console.log('Make sure your backend server is running on http://localhost:3000\n');
  console.log('='.repeat(50) + '\n');
  
  // Test 1: Check email configuration
  await testEmailConfiguration();
  
  // Test 2: Send test email (replace with your actual email)
  const testEmail = process.argv[2] || 'kalayni.nakat@nineleaps.com'; // Get email from command line argument
  await testSendEmail(testEmail);
  
  // Test 3: Check active cron jobs
  await checkActiveJobs();
  
  // Test 4: Get all schedules
  await getAllSchedules();
  
  // Test 5: Test schedule execution (if schedule ID provided)
  const scheduleId = process.argv[3];
  if (scheduleId) {
    await testScheduleExecution(scheduleId);
  } else {
    console.log('💡 To test schedule execution, run: node test-email.js <email> <schedule_id>');
    console.log('\n' + '='.repeat(50) + '\n');
  }
  
  console.log('🏁 Email testing completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Check your email inbox for the test email');
  console.log('2. If email config failed, check your .env file');
  console.log('3. If no active jobs, create a schedule in the frontend');
  console.log('4. Check backend console logs for detailed debugging info');
}

// Run the tests
runAllTests().catch(console.error);
