import { fetchRatioAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/RatioAnalysisReport.js";

function init() {
  async function execute({ fromDate, toDate }) {
    const s3Url = await fetchRatioAnalysisAndUploadPDF(fromDate, toDate);
    return { s3Url };
  }
  return { execute };
}
export { init };