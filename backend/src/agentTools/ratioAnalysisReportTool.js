import { fetchRatioAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/RatioAnalysisReport.js";

function init() {
  async function execute({ fromDate, toDate }) {
    return await fetchRatioAnalysisAndUploadPDF(fromDate, toDate);
  }
  return { execute };
}
export { init };