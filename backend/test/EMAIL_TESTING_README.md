# Email Testing for Reporting Agent

## Quick Email Test Steps

### 1. Check Environment Variables
Make sure your `.env` file has the correct SMTP settings:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**For Gmail Users:**
- Use an "App Password" instead of your regular password
- Enable 2-factor authentication first
- Generate app password: https://myaccount.google.com/apppasswords

### 2. Start Backend Server
```bash
cd backend
npm start
```

### 3. Run Email Tests

#### Option A: Using the test script
```bash
cd backend/test
node test-email.js your-email@domain.com
```

#### Option B: Using curl commands

**Test email configuration:**
```bash
curl http://localhost:3000/api/reporting-agent/test-email-config
```

**Send test email:**
```bash
curl -X POST http://localhost:3000/api/reporting-agent/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@domain.com"}'
```

**Check active cron jobs:**
```bash
curl http://localhost:3000/api/reporting-agent/active-jobs
```

**Get all schedules:**
```bash
curl http://localhost:3000/api/reporting-agent/schedules
```

**Test specific schedule execution:**
```bash
curl -X POST http://localhost:3000/api/reporting-agent/test-schedule/SCHEDULE_ID
```

### 4. Frontend Testing

1. Go to the Reporting Agent page
2. Create a schedule with your email
3. Check if the cron job is created (backend logs)
4. Use the test endpoint to manually trigger the schedule

### 5. Common Issues & Solutions

#### SMTP Authentication Failed
- Check if you're using the correct app password (not regular password)
- Verify the email address in `SMTP_USER`
- Make sure 2FA is enabled for Gmail

#### No Cron Jobs Running
- Check if schedules are marked as `isActive: true`
- Restart the backend server to restore jobs from database
- Check backend logs for cron job creation messages

#### Report Generation Failed
- The `fetchCashFlowProjectionAndUploadPDF` function might be failing
- Check if Tally services are running
- Look for error messages in backend logs

#### Email Sent but Not Received
- Check spam/junk folder
- Verify the recipient email address
- Check email provider's delivery logs

### 6. Debug Logs to Look For

When testing, watch for these messages in backend logs:

```
✅ Email configuration is valid
📅 Creating cron job for schedule X: 0 9 * * *
🚀 Cron job triggered for schedule X at [timestamp]
📊 Generating cash_flow_projection report...
✅ Report generated: [report details]
📧 Sending report email to: email@domain.com
✅ Report email sent successfully for schedule X
```

### 7. Testing with Different Time Schedules

To test quickly, create a schedule for the next minute:
1. Create schedule with time set to current time + 1 minute
2. Wait and watch backend logs
3. Check if email is received

Example: If current time is 2:30 PM, set schedule time to 2:31 PM.
