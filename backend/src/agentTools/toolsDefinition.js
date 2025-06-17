export const VECTOR_SEARCH_TOOL = {
  type: "function",
  function: {
    name: "vectorSearch",
    description:
      "Retrieve detailed product specifications, pricing, technical documents, and company-related details from the vector database. Use this function for queries related to specific products, comparisons, technical specifications, pricing, or company information.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "User query for searching product, pricing, or company-related data.",
        },
      },
      required: ["query"],
    },
  },
};

export const RATIO_ANALYSIS_REPORT_TOOL = {
  type: "function",
  function: {
    name: "ratioAnalysis",
    description:
      "Generate and provide a Ratio Analysis PDF report for a given date range. Use this for requests about financial ratio analysis reports.",
    parameters: {
      type: "object",
      properties: {
        fromDate: {
          type: "string",
          description: "Start date in YYYYMMDD format.",
        },
        toDate: {
          type: "string",
          description: "End date in YYYYMMDD format.",
        },
      },
      required: ["fromDate", "toDate"],
    },
  },
};
export const PROFIT_LOSS_REPORT_TOOL = {
  type: "function",
  function: {
    name: "profitLossReport",
    description:
      "Generate a Profit and Loss PDF report for the specified date range (fromDate to toDate, both in YYYYMMDD format). Use this tool whenever the user requests a profit and loss or P&L report. After generating, provide the user with a download link to the PDF report.",
    parameters: {
      type: "object",
      properties: {
        fromDate: {
          type: "string",
          description: "Start date in YYYYMMDD format.",
        },
        toDate: {
          type: "string",
          description: "End date in YYYYMMDD format.",
        },
      },
      required: ["fromDate", "toDate"],
    },
  },
};

export const CASH_FLOW_STATEMENT_REPORT_TOOL = {
  type: "function",
  function: {
    name: "cashFlowStatementReport",
    description:
      "Generate a Cash Flow Statement PDF report for the specified date range (fromDate to toDate, both in YYYYMMDD format). Use this tool whenever the user requests a cash flow statement report. After generating, provide the user with a download link to the PDF report.",
    parameters: {
      type: "object",
      properties: {
        fromDate: {
          type: "string",
          description: "Start date in YYYYMMDD format.",
        },
        toDate: {
          type: "string",
          description: "End date in YYYYMMDD format.",
        },
      },
      required: ["fromDate", "toDate"],
    },
  },
};
export const CASH_FLOW_PROJECTION_REPORT_TOOL = {
  type: "function",
  function: {
    name: "cashFlowProjectionReport",
    description:
      "Generate a Cash Flow Projection PDF report for the specified date range (fromDate to toDate, both in YYYYMMDD format). Use this tool whenever the user requests a cash flow projection report. After generating, provide the user with a download link to the PDF report.",
    parameters: {
      type: "object",
      properties: {
        fromDate: {
          type: "string",
          description: "Start date in YYYYMMDD format.",
        },
        toDate: {
          type: "string",
          description: "End date in YYYYMMDD format.",
        },
      },
      required: ["fromDate", "toDate"],
    },
  },
};
export const EXPENSE_ANALYSIS_REPORT_TOOL = {
  type: "function",
  function: {
    name: "expenseAnalysisReport",
    description:
      "Generate an Expense Analysis PDF report (Direct & Indirect Expenses only) for the specified date range (fromDate to toDate, both in YYYYMMDD format). Use this tool whenever the user requests an expense analysis report. After generating, provide the user with a download link to the PDF report.",
    parameters: {
      type: "object",
      properties: {
        fromDate: {
          type: "string",
          description: "Start date in YYYYMMDD format.",
        },
        toDate: {
          type: "string",
          description: "End date in YYYYMMDD format.",
        },
      },
      required: ["fromDate", "toDate"],
    },
  },
};