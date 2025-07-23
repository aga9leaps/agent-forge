import express from "express";
import cron from "node-cron";
import nodemailer from "nodemailer";
import ReportingAgentDB from "../models/reportingAgentModel.js";
import { fetchCashFlowProjectionAndUploadPDF } from "../../Tally/FinanacialReports/CashFlowProjectionReport.js";
import { fetchTallyReportAndUploadPDF } from "../../Tally/FinanacialReports/tallyReportUtils.js";
import { fetchProfitAndLossAndUploadPDF } from "../../Tally/FinanacialReports/ProfitLossReport.js";
import { fetchCashFlowStatementAndUploadPDF } from "../../Tally/FinanacialReports/CashFlowStatementReport.js";
import { fetchRatioAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/RatioAnalysisReport.js";
import { generateAndUploadReport } from "../utils/reportStorageUtils.js";

class ReportingAgentController {
  constructor() {
    this.scheduledJobs = new Map();
    this.alerts = new Map();
    this.db = new ReportingAgentDB();
    this.initController();
  }

  async initController() {
    try {
      // Test database connection and initialize tables
      const isConnected = await this.db.testConnection();
      if (!isConnected) {
        console.warn('Database connection failed, but continuing with Reporting Agent initialization');
        // Don't throw error - allow the app to continue without reporting agent
      } else {
        // Initialize database tables only if connection is successful
        await this.db.initTables();
        console.log('Reporting agent tables initialized successfully');
      }
      
      // Setup email transporter
      this.setupEmailTransporter();
      
      // Restore scheduled jobs and alerts from database (only if connected)
      if (isConnected) {
        await this.restoreScheduledJobs();
        await this.restoreAlertMonitoring();
      }
      
      console.log('Reporting Agent Controller initialized successfully');
    } catch (error) {
      console.error('Error initializing Reporting Agent Controller:', error);
      // Don't throw the error - allow the app to continue
      console.warn('Reporting Agent will continue with limited functionality');
    }
  }

  setupEmailTransporter() {
    // Configure email transporter using environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || "your-email@gmail.com",
        pass: process.env.SMTP_PASS || "your-app-password",
      },
    });
  }

  async restoreScheduledJobs() {
    try {
      const schedules = await this.db.getActiveSchedules();
      schedules.forEach((schedule) => {
        this.createScheduledJob(schedule);
      });
      console.log(`Restored ${schedules.length} scheduled jobs`);
      
      // Log the status of all scheduled jobs
      this.logScheduledJobsStatus();
    } catch (error) {
      console.error("Error restoring scheduled jobs:", error);
      console.warn("Scheduled jobs will not be restored - manual restart may be required");
    }
  }

  logScheduledJobsStatus() {
    console.log(`📊 Current scheduled jobs status:`);
    console.log(`📊 Total active cron jobs: ${this.scheduledJobs.size}`);
    
    if (this.scheduledJobs.size > 0) {
      console.log(`📋 Active job IDs: [${Array.from(this.scheduledJobs.keys()).join(', ')}]`);
    } else {
      console.log(`📋 No active cron jobs found`);
    }
  }

  async restoreAlertMonitoring() {
    try {
      const alerts = await this.db.getActiveAlerts();
      alerts.forEach((alert) => {
        this.startAlertMonitoring(alert);
      });
      console.log(`Restored ${alerts.length} alert monitors`);
    } catch (error) {
      console.error("Error restoring alert monitoring:", error);
      console.warn("Alert monitoring will not be restored - manual restart may be required");
    }
  }

  // 1. Report Scheduling
  async scheduleReport(req, res) {
    try {
      const { reportType, frequency, emails, fromDate, toDate, time, isActive = true } = req.body;

      if (!reportType || !frequency || !emails || !emails.length) {
        return res.status(400).json({
          success: false,
          message: "Report type, frequency, and emails are required",
        });
      }

      const scheduleId = await this.db.createSchedule({
        reportType,
        frequency,
        emails,
        fromDate,
        toDate,
        time: time || "09:00",
        isActive,
      });

      const schedule = {
        id: scheduleId.toString(),
        reportType,
        frequency,
        emails,
        fromDate,
        toDate,
        time: time || "09:00",
        isActive,
        createdAt: new Date().toISOString(),
      };

      if (isActive) {
        if (schedule.frequency === "one-time") {
          // For one-time reports, execute immediately
          console.log(`📅 Executing one-time report immediately for schedule ${scheduleId}`);
          this.executeScheduledReport(schedule).catch(error => {
            console.error("Error executing one-time report:", error);
          });
        } else {
          // For recurring reports, create a cron job
          this.createScheduledJob(schedule);
        }
      }

      res.json({
        success: true,
        message: "Report scheduled successfully",
        schedule,
      });
    } catch (error) {
      console.error("Error scheduling report:", error);
      res.status(500).json({
        success: false,
        message: "Error scheduling report",
        error: error.message,
      });
    }
  }

  createScheduledJob(schedule) {
    // Don't create cron jobs for one-time schedules
    if (schedule.frequency === "one-time") {
      console.log(`⚠️  Skipping cron job creation for one-time schedule ${schedule.id}`);
      return;
    }

    let cronExpression;
    const [hour, minute] = schedule.time.split(":");
    const now = new Date();

    switch (schedule.frequency) {
      case "daily":
        cronExpression = `${minute} ${hour} * * *`;
        break;
      case "weekly":
        // Use current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const currentDayOfWeek = now.getDay();
        cronExpression = `${minute} ${hour} * * ${currentDayOfWeek}`;
        break;
      case "monthly":
        // Use current day of the month
        const currentDayOfMonth = now.getDate();
        cronExpression = `${minute} ${hour} ${currentDayOfMonth} * *`;
        break;
      default:
        cronExpression = `${minute} ${hour} * * *`;
    }

    console.log(`📅 Creating cron job for schedule ${schedule.id}: ${cronExpression}`);
    
    // Validate cron expression
    try {
      // Test if the cron expression is valid by creating a temporary job
      const testJob = cron.schedule(cronExpression, () => {}, { scheduled: false });
      testJob.destroy();
      console.log(`✅ Cron expression validated: ${cronExpression}`);
    } catch (error) {
      console.error(`❌ Invalid cron expression: ${cronExpression}`, error);
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }
    
    // Generate appropriate message based on frequency
    let nextExecutionMessage;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    switch (schedule.frequency) {
      case "daily":
        nextExecutionMessage = `⏰ Next execution will be at ${hour}:${minute} daily`;
        break;
      case "weekly":
        const currentDayName = dayNames[now.getDay()];
        nextExecutionMessage = `⏰ Next execution will be at ${hour}:${minute} every ${currentDayName}`;
        break;
      case "monthly":
        const currentDayOfMonth = now.getDate();
        const suffix = currentDayOfMonth === 1 ? 'st' : currentDayOfMonth === 2 ? 'nd' : currentDayOfMonth === 3 ? 'rd' : 'th';
        nextExecutionMessage = `⏰ Next execution will be at ${hour}:${minute} on the ${currentDayOfMonth}${suffix} of each month`;
        break;
      default:
        nextExecutionMessage = `⏰ Next execution will be at ${hour}:${minute} daily`;
    }
    console.log(nextExecutionMessage);

    const job = cron.schedule(cronExpression, async () => {
      console.log(`🚀 Cron job triggered for schedule ${schedule.id} at ${new Date().toLocaleString()}`);
      console.log(`📋 Schedule details:`, {
        id: schedule.id,
        reportType: schedule.reportType,
        frequency: schedule.frequency,
        emails: schedule.emails,
        cronExpression: cronExpression
      });
      await this.executeScheduledReport(schedule);
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata",
    });

    this.scheduledJobs.set(schedule.id, job);
    console.log(`✅ Cron job created and scheduled for ID: ${schedule.id}`);
    
    // Calculate and log next execution time
    const nextExecution = this.getNextExecutionTime(cronExpression);
    if (nextExecution) {
      console.log(`📅 Next execution scheduled for: ${nextExecution.toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`);
    }
    
    // Don't execute immediately on startup - let the cron schedule handle all executions
    // This prevents duplicate emails when the backend restarts
    console.log(`⏰ Report will be sent according to the cron schedule: ${cronExpression}`);
  }

  // This method is no longer needed as we're not doing immediate execution
  // shouldExecuteImmediately(schedule, now) {
  //   // Removed to prevent immediate execution on backend restart
  //   return false;
  // }

  async executeScheduledReport(schedule) {
    try {
      console.log(`🚀 Executing scheduled report: ${schedule.reportType} for schedule ID: ${schedule.id}`);
      console.log(`📧 Email recipients: ${schedule.emails.join(', ')}`);
      
      // Calculate date range based on frequency if not provided
      let fromDate = schedule.fromDate;
      let toDate = schedule.toDate;
      
      if (!fromDate || !toDate) {
        const today = new Date();
        toDate = this.formatDateForTally(today);
        
        switch (schedule.frequency) {
          case "daily":
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            fromDate = this.formatDateForTally(yesterday);
            break;
          case "weekly":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            fromDate = this.formatDateForTally(weekAgo);
            break;
          case "monthly":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            fromDate = this.formatDateForTally(monthAgo);
            break;
        }
      } else {
        // Convert frontend date format (YYYY-MM-DD) to Tally format (YYYYMMDD)
        fromDate = this.convertToTallyDateFormat(fromDate);
        toDate = this.convertToTallyDateFormat(toDate);
      }

      console.log(`📅 Report date range: ${fromDate} to ${toDate}`);

      // Generate the report and upload to Google Cloud Storage
      let reportResult;
      console.log(`📊 Generating ${schedule.reportType} report and uploading to Google Cloud Storage...`);
      
      switch (schedule.reportType) {
        case "cash_flow_projection":
          reportResult = await generateAndUploadReport(
            fetchCashFlowProjectionAndUploadPDF, 
            "cash_flow_projection", 
            fromDate, 
            toDate
          );
          break;
        case "profit_loss":
          reportResult = await generateAndUploadReport(
            fetchProfitAndLossAndUploadPDF, 
            "profit_loss", 
            fromDate, 
            toDate
          );
          break;
        case "cash_flow_statement":
          reportResult = await generateAndUploadReport(
            fetchCashFlowStatementAndUploadPDF, 
            "cash_flow_statement", 
            fromDate, 
            toDate
          );
          break;
        case "ratio_analysis":
          reportResult = await generateAndUploadReport(
            fetchRatioAnalysisAndUploadPDF, 
            "ratio_analysis", 
            fromDate, 
            toDate
          );
          break;
        case "expense_analysis":
          reportResult = await generateAndUploadReport(
            (from, to) => fetchTallyReportAndUploadPDF(from, to, 'expense_analysis'), 
            "expense_analysis", 
            fromDate, 
            toDate
          );
          break;
        default:
          throw new Error(`Unsupported report type: ${schedule.reportType}`);
      }

      console.log(`✅ Report generated:`, reportResult);

      // Send email with report
      if (reportResult && reportResult.downloadUrl) {
        console.log(`📧 Sending report email to: ${schedule.emails.join(', ')}`);
        await this.sendReportEmail(schedule, reportResult);
        console.log(`✅ Report email sent successfully for schedule ${schedule.id}`);
      } else {
        console.error(`❌ No download URL available for report. Result:`, reportResult);
        throw new Error("Report generation failed - no download URL");
      }

    } catch (error) {
      console.error(`❌ Error executing scheduled report for schedule ${schedule.id}:`, error);
      // Send error notification email
      await this.sendErrorNotification(schedule, error);
    }
  }

  // Helper method to format date for Tally XML (YYYYMMDD format)
  formatDateForTally(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  // Helper method to convert frontend date format (YYYY-MM-DD) to Tally format (YYYYMMDD)
  convertToTallyDateFormat(dateString) {
    if (!dateString) return null;
    
    // If already in YYYYMMDD format, return as is
    if (/^\d{8}$/.test(dateString)) {
      return dateString;
    }
    
    // Convert from YYYY-MM-DD to YYYYMMDD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString.replace(/-/g, '');
    }
    
    // Try to parse the date and format it
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return this.formatDateForTally(date);
    }
    
    return null;
  }

  async sendReportEmail(schedule, reportResult) {
    try {
      console.log(`📧 Preparing to send report email for schedule ${schedule.id}`);
      console.log(`📧 Recipients: ${schedule.emails.join(', ')}`);
      console.log(`📧 Report URL: ${reportResult.downloadUrl}`);
      
      const mailOptions = {
        from: process.env.SMTP_USER || "noreply@company.com",
        to: schedule.emails.join(", "),
        subject: `Scheduled ${schedule.reportType.replace(/_/g, " ").toUpperCase()} Report`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 25px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">📊 Scheduled Report Ready</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Your financial report has been successfully generated</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your scheduled <strong style="color: #1f2937;">${schedule.reportType.replace(/_/g, " ").toUpperCase()}</strong> report has been generated. Feel free to check it out anytime.
              </p>
              
              <!-- Report Details Card -->
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center; color: #475569; font-size: 14px;">
                    <span style="display: inline-block; width: 20px; font-size: 16px;">📅</span>
                    <strong style="margin-right: 8px; color: #334155;">Frequency:</strong> ${schedule.frequency}
                  </div>
                  <div style="display: flex; align-items: center; color: #475569; font-size: 14px;">
                    <span style="display: inline-block; width: 20px; font-size: 16px;">🕐</span>
                    <strong style="margin-right: 8px; color: #334155;">Generated:</strong> ${new Date().toLocaleString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </div>
                  <div style="display: flex; align-items: center; color: #475569; font-size: 14px;">
                    <span style="display: inline-block; width: 20px; font-size: 16px;">📧</span>
                    <strong style="margin-right: 8px; color: #334155;">Recipients:</strong> ${schedule.emails.length} person(s)
                  </div>
                </div>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
              <a href="${reportResult.downloadUrl}" 
                target="_blank" 
                style="
                  display: inline-block;
                  color: #dc2626;
                  background: white;
                  padding: 15px 30px;
                  text-decoration: none;
                  border: 2px solid #dc2626;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 16px;
                  box-shadow: none;
                  transition: all 0.3s ease;
                "
                onmouseover="this.style.background='#ffe4e6'; this.style.color='#b91c1c'"
                onmouseout="this.style.background='white'; this.style.color='#dc2626'"
              >
                📄 Access Report Securely
              </a>
              <p style="margin: 15px 0 0 0; font-size: 13px; color: #6b7280; font-style: italic;">
                Click to access the report
              </p>
            </div>      
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <!-- Footer -->
              <div style="text-align: left;">
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 15px 0;">
                  Best regards,<br>
                  <strong style="color: #374151;">Reporting Agent</strong><br>
                  <span style="color: #9ca3af;">Magic Paints Financial System</span>
                </p>
                
                <!-- Powered by Noviro.ai -->
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #f3f4f6;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    Powered by <a href="https://www.noviro.ai/" 
                                  target="_blank" 
                                  style="color: #dc2626; text-decoration: none; font-weight: 600;">Noviro.ai</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        `,
      };

      console.log(`📧 Sending email with options:`, {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Report email sent successfully for schedule ${schedule.id}`);
    } catch (error) {
      console.error(`❌ Error sending report email for schedule ${schedule.id}:`, error);
      throw error; // Re-throw to trigger error notification
    }
  }

  async sendErrorNotification(schedule, error) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || "noreply@company.com",
        to: schedule.emails.join(", "),
        subject: `Report Generation Failed - ${schedule.reportType}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 25px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">⚠️ Report Generation Failed</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">There was an issue generating your scheduled report</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We encountered an error while generating your scheduled <strong style="color: #1f2937;">${schedule.reportType.replace(/_/g, " ").toUpperCase()}</strong> report.
              </p>
              
              <!-- Error Details Card -->
              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <div style="display: grid; gap: 12px;">
                  <div style="color: #991b1b; font-size: 14px;">
                    <strong style="display: block; margin-bottom: 8px; color: #7f1d1d;">Error Details:</strong>
                    <code style="background: rgba(127, 29, 29, 0.1); padding: 8px 12px; border-radius: 4px; font-family: 'Courier New', monospace; display: block; word-break: break-all;">${error.message}</code>
                  </div>
                  <div style="color: #7f1d1d; font-size: 14px;">
                    <strong>Time:</strong> ${new Date().toLocaleString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              <!-- Next Steps -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #7dd3fc; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 16px;">💡 Next Steps</h3>
                <ul style="margin: 0; padding-left: 20px; color: #0369a1;">
                  <li style="margin-bottom: 5px;">Please contact your system administrator for assistance</li>
                  <li style="margin-bottom: 5px;">The error has been logged for further investigation</li>
                  <li>You may try running the report manually from the dashboard</li>
                </ul>
              </div>
              
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <!-- Footer -->
              <div style="text-align: center;">
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 15px 0;">
                  Best regards,<br>
                  <strong style="color: #374151;">Reporting Agent</strong><br>
                  <span style="color: #9ca3af;">Magic Paints Financial System</span>
                </p>
                
                <!-- Powered by Noviro.ai -->
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #f3f4f6;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    Powered by <a href="https://www.noviro.ai/" 
                                  target="_blank" 
                                  style="color: #dc2626; text-decoration: none; font-weight: 600;">Noviro.ai</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("Error sending error notification:", emailError);
    }
  }

  // 2. Cash Flow Projections (Enhanced visualization data)
  async getCashFlowProjections(req, res) {
    try {
      const { months = 6 } = req.query;
      
      // Generate cash flow projection data
      const projections = await this.generateCashFlowProjectionData(months);
      
      res.json({
        success: true,
        data: projections,
      });
    } catch (error) {
      console.error("Error getting cash flow projections:", error);
      res.status(500).json({
        success: false,
        message: "Error generating cash flow projections",
        error: error.message,
      });
    }
  }

  async generateCashFlowProjectionData(months) {
    // This would integrate with your existing Tally data
    // For now, returning mock data structure
    const projections = [];
    const currentDate = new Date();
    
    for (let i = 0; i < months; i++) {
      const projectionDate = new Date(currentDate);
      projectionDate.setMonth(projectionDate.getMonth() + i);
      
      // In a real implementation, this would calculate based on historical data
      projections.push({
        month: projectionDate.toISOString().slice(0, 7),
        monthName: projectionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        projectedInflow: Math.round(500000 + Math.random() * 200000),
        projectedOutflow: Math.round(400000 + Math.random() * 150000),
        netCashFlow: null, // Will be calculated
        cumulativeBalance: null, // Will be calculated
      });
    }
    
    // Calculate net cash flow and cumulative balance
    let cumulativeBalance = 1000000; // Starting balance
    projections.forEach(projection => {
      projection.netCashFlow = projection.projectedInflow - projection.projectedOutflow;
      cumulativeBalance += projection.netCashFlow;
      projection.cumulativeBalance = cumulativeBalance;
    });
    
    return projections;
  }

  // 3. Automated Financial Alerts
  async createAlert(req, res) {
    try {
      const { metric, threshold, condition, emails, isActive = true } = req.body;

      if (!metric || !threshold || !condition || !emails || !emails.length) {
        return res.status(400).json({
          success: false,
          message: "Metric, threshold, condition, and emails are required",
        });
      }

      const alertId = await this.db.createAlert({
        metric,
        threshold,
        condition,
        emails,
        isActive,
      });

      const alert = {
        id: alertId.toString(),
        metric,
        threshold,
        condition,
        emails,
        isActive,
        lastTriggered: null,
        createdAt: new Date().toISOString(),
      };

      if (isActive) {
        this.startAlertMonitoring(alert);
      }

      res.json({
        success: true,
        message: "Alert created successfully",
        alert,
      });
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({
        success: false,
        message: "Error creating alert",
        error: error.message,
      });
    }
  }

  startAlertMonitoring(alert) {
    // Check alerts every hour
    const job = cron.schedule("0 * * * *", async () => {
      await this.checkAlert(alert);
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata",
    });

    this.alerts.set(alert.id, job);
  }

  async checkAlert(alert) {
    try {
      // Get current value of the metric
      const currentValue = await this.getMetricValue(alert.metric);
      
      let shouldTrigger = false;
      
      switch (alert.condition) {
        case "greater_than":
          shouldTrigger = currentValue > alert.threshold;
          break;
        case "less_than":
          shouldTrigger = currentValue < alert.threshold;
          break;
        case "equals":
          shouldTrigger = Math.abs(currentValue - alert.threshold) < 0.01;
          break;
      }

      if (shouldTrigger) {
        await this.triggerAlert(alert, currentValue);
      }
    } catch (error) {
      console.error("Error checking alert:", error);
    }
  }

  async getMetricValue(metric) {
    // This would integrate with your existing financial data
    // For now, returning mock values
    const mockValues = {
      cash_balance: 850000,
      profit_margin: 15.5,
      accounts_receivable: 320000,
      current_ratio: 2.1,
      debt_to_equity: 0.45,
    };
    
    return mockValues[metric] || 0;
  }

  async triggerAlert(alert, currentValue) {
    try {
      // Update last triggered time in database
      await this.db.updateAlertLastTriggered(alert.id);

      // Send alert email
      const mailOptions = {
        from: process.env.SMTP_USER || "noreply@company.com",
        to: alert.emails.join(", "),
        subject: `Financial Alert: ${alert.metric} Threshold Exceeded`,
        html: `
          <h2>Financial Alert Triggered</h2>
          <p><strong>Metric:</strong> ${alert.metric.replace(/_/g, " ").toUpperCase()}</p>
          <p><strong>Current Value:</strong> ${currentValue}</p>
          <p><strong>Threshold:</strong> ${alert.threshold}</p>
          <p><strong>Condition:</strong> ${alert.condition.replace(/_/g, " ")}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p>Please review the financial metrics and take appropriate action.</p>
          <br>
          <p>Best regards,<br>Financial Alert System</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Alert triggered and email sent for ${alert.metric}`);
    } catch (error) {
      console.error("Error triggering alert:", error);
    }
  }

  // 4. Assign Report for Analysis
  async assignReport(req, res) {
    try {
      const { reportType, assigneeEmail, assigneeName, message, dueDate, priority = "medium" } = req.body;

      if (!reportType || !assigneeEmail || !assigneeName) {
        return res.status(400).json({
          success: false,
          message: "Report type, assignee email, and assignee name are required",
        });
      }

      const assignmentId = await this.db.createAssignment({
        reportType,
        assigneeEmail,
        assigneeName,
        message: message || "",
        dueDate,
        priority,
        assignedBy: req.user?.name || "Admin", // Assumes auth middleware sets req.user
      });

      const assignment = {
        id: assignmentId.toString(),
        reportType,
        assigneeEmail,
        assigneeName,
        message: message || "",
        dueDate,
        priority,
        status: "assigned",
        assignedAt: new Date().toISOString(),
        assignedBy: req.user?.name || "Admin",
      };

      // Send assignment email
      await this.sendAssignmentEmail(assignment);

      res.json({
        success: true,
        message: "Report assigned successfully",
        assignment,
      });
    } catch (error) {
      console.error("Error assigning report:", error);
      res.status(500).json({
        success: false,
        message: "Error assigning report",
        error: error.message,
      });
    }
  }

  async sendAssignmentEmail(assignment) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || "noreply@company.com",
        to: assignment.assigneeEmail,
        subject: `📋 Report Assignment: ${assignment.reportType.replace(/_/g, " ").toUpperCase()}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 25px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">📋 Report Analysis Assignment</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">You have been assigned a report for analysis</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong style="color: #1f2937;">${assignment.assigneeName}</strong>,
              </p>
              
              <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                You have been assigned a report for analysis. Please review the details below and provide your analysis.
              </p>
              
              <!-- Assignment Details Card -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center; color: #166534; font-size: 14px;">
                    <span style="display: inline-block; width: 20px; font-size: 16px;">📊</span>
                    <strong style="margin-right: 8px; color: #14532d;">Report Type:</strong> ${assignment.reportType.replace(/_/g, " ").toUpperCase()}
                  </div>
                  <div style="display: flex; align-items: center; color: #166534; font-size: 14px;">
                    <span style="display: inline-block; width: 20px; font-size: 16px;">⚡</span>
                    <strong style="margin-right: 8px; color: #14532d;">Priority:</strong> 
                    <span style="color: ${assignment.priority === 'high' ? '#dc2626' : assignment.priority === 'medium' ? '#d97706' : '#059669'}; font-weight: 600; text-transform: uppercase;">
                      ${assignment.priority}
                    </span>
                  </div>
                  <div style="display: flex; align-items: center; color: #166534; font-size: 14px;">
                    <span style="display: inline-block; width: 20px; font-size: 16px;">📅</span>
                    <strong style="margin-right: 8px; color: #14532d;">Due Date:</strong> ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric'
                    }) : "Not specified"}
                  </div>
                  <div style="display: flex; align-items: center; color: #166534; font-size: 14px;">
                    <span style="display: inline-block; width: 20px; font-size: 16px;">👤</span>
                    <strong style="margin-right: 8px; color: #14532d;">Assigned By:</strong> ${assignment.assignedBy}
                  </div>
                  <div style="display: flex; align-items: center; color: #166534; font-size: 14px;">
                    <span style="display: inline-block; width: 20px; font-size: 16px;">📝</span>
                    <strong style="margin-right: 8px; color: #14532d;">Assignment ID:</strong> <code style="background: rgba(20, 83, 45, 0.1); padding: 2px 6px; border-radius: 3px; font-family: monospace;">${assignment.id}</code>
                  </div>
                </div>
              </div>
              
              ${assignment.message ? `
              <!-- Custom Message -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #93c5fd; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 16px; display: flex; align-items: center;">
                  💬 Additional Instructions
                </h3>
                <p style="margin: 0; color: #1e40af; font-style: italic; line-height: 1.6;">
                  "${assignment.message}"
                </p>
              </div>
              ` : ""}
              
              <!-- Next Steps -->
              <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">📋 Next Steps</h3>
                <ol style="margin: 0; padding-left: 20px; color: #a16207;">
                  <li style="margin-bottom: 5px;">Access the report from the dashboard</li>
                  <li style="margin-bottom: 5px;">Analyze the data and findings</li>
                  <li>Submit your analysis and recommendations</li>
                </ol>
              </div>
              
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <!-- Footer -->
              <div style="text-align: center;">
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 15px 0;">
                  Best regards,<br>
                  <strong style="color: #374151;">Reporting System</strong><br>
                  <span style="color: #9ca3af;">Magic Paints Financial System</span>
                </p>
                
                <!-- Powered by Noviro.ai -->
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #f3f4f6;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    Powered by <a href="https://www.noviro.ai/" 
                                  target="_blank" 
                                  style="color: #dc2626; text-decoration: none; font-weight: 600;">Noviro.ai</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Assignment email sent to ${assignment.assigneeEmail}`);
    } catch (error) {
      console.error("Error sending assignment email:", error);
    }
  }

  // Get all schedules
  async getSchedules(req, res) {
    try {
      const schedules = await this.db.getAllSchedules();
      res.json({
        success: true,
        schedules,
      });
    } catch (error) {
      console.error("Error getting schedules:", error);
      res.status(500).json({
        success: false,
        message: "Error getting schedules",
        error: error.message,
      });
    }
  }

  // Get status of all scheduled jobs (for debugging)
  async getScheduledJobsStatus(req, res) {
    try {
      const jobStatus = [];
      
      for (const [scheduleId, job] of this.scheduledJobs.entries()) {
        const schedules = await this.db.getAllSchedules();
        const schedule = schedules.find(s => s.id === scheduleId);
        
        if (schedule) {
          // Reconstruct cron expression to get next execution time
          const [hour, minute] = schedule.time.split(":");
          const now = new Date();
          let cronExpression;
          
          switch (schedule.frequency) {
            case "daily":
              cronExpression = `${minute} ${hour} * * *`;
              break;
            case "weekly":
              const currentDayOfWeek = now.getDay();
              cronExpression = `${minute} ${hour} * * ${currentDayOfWeek}`;
              break;
            case "monthly":
              const currentDayOfMonth = now.getDate();
              cronExpression = `${minute} ${hour} ${currentDayOfMonth} * *`;
              break;
            default:
              cronExpression = `${minute} ${hour} * * *`;
          }
          
          const nextExecution = this.getNextExecutionTime(cronExpression);
          
          jobStatus.push({
            scheduleId: scheduleId,
            reportType: schedule.reportType,
            frequency: schedule.frequency,
            time: schedule.time,
            cronExpression: cronExpression,
            isActive: !!job,
            nextExecution: nextExecution ? nextExecution.toISOString() : null,
            nextExecutionLocal: nextExecution ? nextExecution.toLocaleString('en-IN', { 
              timeZone: 'Asia/Kolkata',
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : null,
            emails: schedule.emails
          });
        }
      }
      
      res.json({
        success: true,
        totalJobs: this.scheduledJobs.size,
        scheduledJobs: Array.from(this.scheduledJobs.keys()),
        jobDetails: jobStatus
      });
    } catch (error) {
      console.error("Error getting scheduled jobs status:", error);
      res.status(500).json({
        success: false,
        message: "Error getting scheduled jobs status",
        error: error.message,
      });
    }
  }

  // Get all alerts
  async getAlerts(req, res) {
    try {
      const alerts = await this.db.getAllAlerts();
      res.json({
        success: true,
        alerts,
      });
    } catch (error) {
      console.error("Error getting alerts:", error);
      res.status(500).json({
        success: false,
        message: "Error getting alerts",
        error: error.message,
      });
    }
  }

  // Get all assignments
  async getAssignments(req, res) {
    try {
      const assignments = await this.db.getAllAssignments();
      res.json({
        success: true,
        assignments,
      });
    } catch (error) {
      console.error("Error getting assignments:", error);
      res.status(500).json({
        success: false,
        message: "Error getting assignments",
        error: error.message,
      });
    }
  }

  // Update schedule status
  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      await this.db.updateScheduleStatus(id, isActive);

      // Stop or start the job
      if (this.scheduledJobs.has(id)) {
        this.scheduledJobs.get(id).stop();
        this.scheduledJobs.delete(id);
      }

      if (isActive) {
        // Get the updated schedule from database to create job
        const schedules = await this.db.getAllSchedules();
        const schedule = schedules.find(s => s.id === id);
        if (schedule) {
          this.createScheduledJob(schedule);
        }
      }

      res.json({
        success: true,
        message: "Schedule updated successfully",
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
      res.status(500).json({
        success: false,
        message: "Error updating schedule",
        error: error.message,
      });
    }
  }

  // Delete schedule
  async deleteSchedule(req, res) {
    try {
      const { id } = req.params;

      // Stop and remove the scheduled job if it exists
      if (this.scheduledJobs.has(id)) {
        this.scheduledJobs.get(id).stop();
        this.scheduledJobs.delete(id);
        console.log(`Stopped and removed cron job for schedule ${id}`);
      }

      // Delete from database
      await this.db.deleteSchedule(id);

      res.json({
        success: true,
        message: "Schedule deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting schedule",
        error: error.message,
      });
    }
  }

  // Update alert status
  async updateAlert(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      await this.db.updateAlertStatus(id, isActive);

      // Stop or start the monitoring
      if (this.alerts.has(id)) {
        this.alerts.get(id).stop();
        this.alerts.delete(id);
      }

      if (isActive) {
        // Get the updated alert from database to start monitoring
        const alerts = await this.db.getAllAlerts();
        const alert = alerts.find(a => a.id === id);
        if (alert) {
          this.startAlertMonitoring(alert);
        }
      }

      res.json({
        success: true,
        message: "Alert updated successfully",
      });
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({
        success: false,
        message: "Error updating alert",
        error: error.message,
      });
    }
  }

  // Delete alert
  async deleteAlert(req, res) {
    try {
      const { id } = req.params;

      // Stop and remove the alert monitoring if it exists
      if (this.alerts.has(id)) {
        this.alerts.get(id).stop();
        this.alerts.delete(id);
        console.log(`Stopped and removed alert monitoring for alert ${id}`);
      }

      // Delete from database
      await this.db.deleteAlert(id);

      res.json({
        success: true,
        message: "Alert deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting alert:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting alert",
        error: error.message,
      });
    }
  }

  // Delete assignment
  async deleteAssignment(req, res) {
    try {
      const { id } = req.params;

      // Delete from database
      await this.db.deleteAssignment(id);

      res.json({
        success: true,
        message: "Assignment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting assignment",
        error: error.message,
      });
    }
  }

  // Helper method to get next execution time for a cron expression
  getNextExecutionTime(cronExpression) {
    try {
      // Parse the cron expression manually to calculate next execution
      const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');
      const now = new Date();
      const nextExecution = new Date(now);
      
      // Set the target time
      nextExecution.setSeconds(0);
      nextExecution.setMilliseconds(0);
      nextExecution.setMinutes(parseInt(minute));
      nextExecution.setHours(parseInt(hour));
      
      // If the time has already passed today, move to next occurrence
      if (nextExecution <= now) {
        if (dayOfWeek !== '*') {
          // Weekly schedule - find next occurrence of the day
          const targetDay = parseInt(dayOfWeek);
          const currentDay = now.getDay();
          let daysToAdd = targetDay - currentDay;
          if (daysToAdd <= 0) {
            daysToAdd += 7; // Next week
          }
          nextExecution.setDate(now.getDate() + daysToAdd);
        } else if (dayOfMonth !== '*') {
          // Monthly schedule - find next occurrence of the day
          const targetDate = parseInt(dayOfMonth);
          if (now.getDate() >= targetDate) {
            // Move to next month
            nextExecution.setMonth(nextExecution.getMonth() + 1);
          }
          nextExecution.setDate(targetDate);
        } else {
          // Daily schedule - move to tomorrow
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
      }
      
      return nextExecution;
    } catch (error) {
      console.error("Error calculating next execution time:", error);
      return null;
    }
  }
}

export default ReportingAgentController;
