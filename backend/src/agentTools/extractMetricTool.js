import { fetchProfitAndLossAndUploadPDF } from "../../Tally/FinanacialReports/ProfitLossReport.js";
import { fetchRatioAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/RatioAnalysisReport.js";
import { fetchCashFlowStatementAndUploadPDF } from "../../Tally/FinanacialReports/CashFlowStatementReport.js";
import { fetchCashFlowProjectionAndUploadPDF } from "../../Tally/FinanacialReports/CashFlowProjectionReport.js";
import { fetchExpenseAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/ExpenseAnalysisReport.js";
import { detectReportTypeFromQuery, findMatchingMetric } from "../../Tally/FinanacialReports/tallyReportUtils.js";

// Helper function to format a date string from YYYYMMDD to readable format
function formatDateString(dateStr) {
  try {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthName = months[parseInt(month) - 1];
    return `${monthName} ${parseInt(day)}, ${year}`;
  } catch (error) {
    console.error("Error formatting date string:", error);
    return dateStr; // Return original if there's an error
  }
}

// Map of report types to their respective fetch functions
const reportFunctions = {
  profit_and_loss_report: fetchProfitAndLossAndUploadPDF,
  ratio_analysis_report: fetchRatioAnalysisAndUploadPDF,
  cash_flow_statement_report: fetchCashFlowStatementAndUploadPDF,
  cash_flow_projection_report: fetchCashFlowProjectionAndUploadPDF,
  expense_analysis_report: fetchExpenseAnalysisAndUploadPDF
};

// Map of report types to their user-friendly names
const reportNames = {
  profit_and_loss_report: "Profit and Loss Report",
  ratio_analysis_report: "Ratio Analysis Report",
  cash_flow_statement_report: "Cash Flow Statement Report",
  cash_flow_projection_report: "Cash Flow Projection Report",
  expense_analysis_report: "Expense Analysis Report"
};

export async function extractMetricTool({ metric, fromDate, toDate, reportType }) {
  try {
    // Special case for profit margin - always get it from ratio analysis report
    if (metric.toLowerCase().includes('profit margin')) {
      console.log("Profit margin requested - using ratio_analysis_report explicitly");
      // Override the detected report type to use ratio analysis
      reportType = 'ratio_analysis_report';
    }
    
    // If report type not specified, try to detect it from the metric query
    const detectedReportType = reportType || detectReportTypeFromQuery(metric);
    
    if (!detectedReportType) {
      // If we couldn't detect the report type, we'll need to check multiple reports
      console.log("Report type not detected, checking all reports for metric:", metric);
      return await checkAllReportsForMetric(metric, fromDate, toDate);
    }
    
    // Get the appropriate report generation function
    const fetchReportFunction = reportFunctions[detectedReportType];
    if (!fetchReportFunction) {
      return `I couldn't find a way to generate a ${detectedReportType} report.`;
    }
    
    // Generate the report
    console.log(`Generating ${detectedReportType} report to extract metric: ${metric}`);
    const reportResult = await fetchReportFunction(fromDate, toDate);
      if (!reportResult || !reportResult.parsedData) {
      return `I generated the ${reportNames[detectedReportType]} but couldn't extract any data from it. You can view the full report using the download link.`;
    }
      
    // Find the requested metric in the parsed data
    const metricResult = findMatchingMetric(reportResult.parsedData, metric);
      
    if (metricResult) {      
      // Special case for profit margin - ensure we're returning a percentage
      if (metric.toLowerCase().includes('profit margin')) {
        console.log("Special handling for profit margin - checking for proper percentage value");
        
        // For profit margin specifically look for net_profit_percentage in ratio analysis
        if (!metricResult.key.includes('percentage')) {
          console.log("Found non-percentage value for profit margin - enforcing percentage metric");
          
          // Try to find net_profit_percentage or gross_profit_percentage as fallback
          if (reportResult.parsedData['net_profit_percentage']) {
            console.log("Found net_profit_percentage to use instead");
            metricResult.value = reportResult.parsedData['net_profit_percentage'];
            metricResult.key = 'net_profit_percentage';
            metricResult.displayName = 'Profit Margin';
          } else if (reportResult.parsedData['gross_profit_percentage']) {
            console.log("Found gross_profit_percentage as fallback");
            metricResult.value = reportResult.parsedData['gross_profit_percentage'];
            metricResult.key = 'gross_profit_percentage';
            metricResult.displayName = 'Profit Margin';
          }
        }
        
        // Always set displayName to "Profit Margin" for consistency
        metricResult.displayName = 'Profit Margin';
        
        // Ensure the value ends with %
        if (metricResult.value && !metricResult.value.includes('%')) {
          metricResult.value = metricResult.value + '%';
          console.log("Added % symbol to value:", metricResult.value);
        }
        
        // Enhanced negative value detection - prioritize direct negative indicators in the value
        if (metricResult.value && metricResult.value.includes('(') && metricResult.value.includes(')')) {
          // Extract the number from parentheses
          const numMatch = metricResult.value.match(/\(([0-9.,]+)\)/);
          if (numMatch && numMatch[1]) {
            metricResult.value = '-' + numMatch[1] + '%';
            console.log("Converted parentheses format to negative:", metricResult.value);
          }
        }
        
        // Check if the value should be negative based on the raw text
        const rawText = reportResult.parsedData._rawText || '';
        const hasNegativeIndicator = rawText.toLowerCase().includes('(-) profit margin') || 
            rawText.toLowerCase().includes('(-)profit margin') ||
            rawText.toLowerCase().includes('profit margin(-)') ||
            rawText.match(/profit margin.*?\(.*?[\d.]+.*?\)/i) || // Profit margin with value in parentheses
            /\([-]?[0-9.,]+\)/.test(rawText); // Look for accounting-style negative numbers
            
        // Ensure the value is negative if indicated but not already
        if (hasNegativeIndicator && metricResult.value && !metricResult.value.includes('-')) {
          metricResult.value = '-' + metricResult.value.replace(/^\-/, ''); // Ensure no double negative
          console.log("Detected negative profit margin, adjusted value:", metricResult.value);
        }
      }

      // Format the metric name for display
      const formattedMetricName = metricResult.displayName || 
                                 (metricResult.exact ? metricResult.key.replace(/_/g, ' ') : 
                                 (metricResult.mappedFrom || metric));
                                 
      // Clean any HTML tags from the value
      const cleanValue = metricResult.value.replace(/<[^>]*>/g, '');
        
      // Create a clear and formatted message with the value (no HTML tags)
      const message = `Based on the ${reportNames[detectedReportType]} from ${formatDateString(fromDate)} to ${formatDateString(toDate)}, the ${formattedMetricName} is ${cleanValue}.\n\nYou can view the full report using the link below for verification.`;
      
      console.log(`Successfully extracted metric "${formattedMetricName}" with value: ${cleanValue}`);
      return {
        value: cleanValue,
        metricName: formattedMetricName,
        reportSource: reportNames[detectedReportType],
        downloadUrl: reportResult.downloadUrl,
        message: message
      };
    } else {
      console.log(`Could not find value for metric "${metric}" in ${detectedReportType}`);
      
      return {
        reportSource: reportNames[detectedReportType],
        downloadUrl: reportResult.downloadUrl,
        message: `I searched for "${metric}" in the ${reportNames[detectedReportType]} from ${formatDateString(fromDate)} to ${formatDateString(toDate)}, but couldn't find a specific value. You can view the full report using the link below to find the information you need.`
      };
    }
  } catch (error) {
    console.error("Error in extractMetricTool:", error);
    return `I encountered an error while trying to extract "${metric}" from the financial reports: ${error.message}`;
  }
}

// Helper function to check all report types for a specific metric
async function checkAllReportsForMetric(metric, fromDate, toDate) {
  // Try the reports in a specific order - from most to least likely to contain the metric
  const reportTypesToCheck = [
    'profit_and_loss_report',
    'ratio_analysis_report',
    'expense_analysis_report',
    'cash_flow_statement_report',
    'cash_flow_projection_report'
  ];
  
  for (const reportType of reportTypesToCheck) {
    try {
      console.log(`Checking ${reportType} for metric: ${metric}`);
      
      // Get the appropriate report generation function
      const fetchReportFunction = reportFunctions[reportType];
      
      // Generate the report
      const reportResult = await fetchReportFunction(fromDate, toDate);
      
      if (reportResult && reportResult.parsedData) {
        // Find the requested metric in the parsed data
        const metricResult = findMatchingMetric(reportResult.parsedData, metric);
        
        if (metricResult) {
          return {
            value: metricResult.value,
            metricName: metricResult.exact ? metricResult.key : (metricResult.mappedFrom || metric),
            reportSource: reportNames[reportType],
            downloadUrl: reportResult.downloadUrl,
            message: `Based on the ${reportNames[reportType]} from ${fromDate} to ${toDate}, the ${metricResult.exact ? metricResult.key.replace(/_/g, ' ') : (metricResult.mappedFrom || metric)} is ${metricResult.value}. You can view the full report using the link below.`
          };
        }
      }
    } catch (error) {
      console.error(`Error checking ${reportType} for metric:`, error);
      // Continue to the next report type
    }
  }
    // If we get here, we couldn't find the metric in any report
  // As a fallback, generate a P&L report which is most commonly requested  
  try {
    const fallbackReport = await fetchProfitAndLossAndUploadPDF(fromDate, toDate);
    return {
      reportSource: reportNames.profit_and_loss_report,
      downloadUrl: fallbackReport.downloadUrl,
      message: `I couldn't find a specific value for "${metric}" in any of our financial reports. I've generated a Profit and Loss Report which might contain relevant information. You can view it using the link below.`
    };
  } catch (error) {
    console.error("Error generating fallback report:", error);
    return `I couldn't find information about "${metric}" in our financial reports, and encountered an error while trying to generate a fallback report: ${error.message}`;
  }
}
