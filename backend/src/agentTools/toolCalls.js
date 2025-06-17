import { vectorSearchTool } from "./vectorSearchTool.js";
import { init as ratioAnalysisReportToolInit } from "./ratioAnalysisReportTool.js";
import { init as cashFlowStatementReportToolInit } from "./cashFlowStatementReportTool.js";
import { init as cashFlowProjectionReportToolInit } from "./cashFlowProjectionReportTool.js";
import { init as expenseAnalysisReportToolInit } from "./expenseAnalysisReportTool.js";
const expenseAnalysisTool = expenseAnalysisReportToolInit();
const cashFlowProjectionTool = cashFlowProjectionReportToolInit();
const cashFlowStatementTool = cashFlowStatementReportToolInit();
const ratioAnalysisTool = ratioAnalysisReportToolInit();

export async function toolSelector(toolName, params) {
  switch (toolName) {
    case "vectorSearch":
      return await vectorSearchTool(params);
    case "ratioAnalysis":
      return await ratioAnalysisTool.execute(params);
    case "cashFlowStatementReport":
      return await cashFlowStatementTool.execute(params);
    case "cashFlowProjectionReport":
      return await cashFlowProjectionTool.execute(params);
    case "expenseAnalysisReport":
      return await expenseAnalysisTool.execute(params);
    default:
      console.log(`Tool ${toolName} is not implemented`);
      break;
  }
}