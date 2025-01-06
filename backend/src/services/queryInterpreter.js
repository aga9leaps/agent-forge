import OpenAI from "openai";
import config from "../config/config.js";

class QueryInterpreter {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async interpretQuery(query) {
    try {
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: "system",
            content: `
              You are a query interpreter that analyzes reporting requests. For each query:
                1. Identify the report type: GENERAL or REPORT
                2. Extract key parameters and filters
                3. Return a JSON with: reportType, parameters, filters
            `,
          },
          {
            role: "user",
            content: query.rawQuery,
          },
        ],
      });

      const interpretation = JSON.parse(response.choices[0].message.content);
      query.parsedQuery = {
        reportType: interpretation.reportType,
        parameters: interpretation.parameters,
        filters: interpretation.filters,
      };

      return query;
    } catch (error) {
      console.error("Error interpreting query:", error);
      throw new Error("Failed to interpret query");
    }
  }
}

export default QueryInterpreter;
