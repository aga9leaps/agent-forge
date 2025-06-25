import { vectorSearchTool } from "./vectorSearchTool.js";
import { ratioAnalysisReportTool } from "./ratioAnalysisReportTool.js";
import { cashFlowStatementReportTool } from "./cashFlowStatementReportTool.js";
import { cashFlowProjectionReportTool } from "./cashFlowProjectionReportTool.js";
import { expenseAnalysisReportTool } from "./expenseAnalysisReportTool.js";
import { profitLossReportTool } from "./profitLossReportTool.js";
import { extractMetricTool } from "./extractMetricTool.js";

export async function toolSelector(toolName, params) {
  switch (toolName) {
    case "vectorSearch":
      return await vectorSearchTool(params);
    case "ratioAnalysis":
      return await ratioAnalysisReportTool(params);
    case "profitLossReport":
      return await profitLossReportTool(params);  
    case "cashFlowStatementReport":
      return await cashFlowStatementReportTool(params);
    case "cashFlowProjectionReport":
      return await cashFlowProjectionReportTool(params);
    case "expenseAnalysisReport":
      return await expenseAnalysisReportTool(params);
    case "extractMetric":
      return await extractMetricTool(params);
    default:
      console.log(`Tool ${toolName} is not implemented`);
      break;
  }
}