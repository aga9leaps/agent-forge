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
        model: config.openai.gpt4MiniModel,
        messages: [
          {
            role: "system",
            content: config.systemPrompt.queryInterpreter,
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

      console.log("🚀 ~ QueryInterpreter ~ interpretQuery ~ query:", query);

      return query;
    } catch (error) {
      console.error("Error interpreting query:", error);
      throw new Error("Failed to interpret query");
    }
  }
}

export default QueryInterpreter;
