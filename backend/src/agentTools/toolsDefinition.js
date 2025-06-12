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

export const SQL_SEARCH_TOOL = {
  type: "function",
  function: {
    name: "sqlSearch",
    description:
      "This data base contains existing customer information, like name, address, contact details, location etc.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The location mentioned by the user",
        },
      },
    },
  },
};
