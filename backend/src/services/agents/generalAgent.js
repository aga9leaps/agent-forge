import BaseAgent from "./baseAgent.js";
import OpenAI from "openai";
import config from "../../config/config.js";

class GeneralAgent extends BaseAgent {
  constructor(db) {
    super(db);
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async processTask(task) {
    await this.validateTask(task);

    try {
      // Get data based on parameters
      const data = await this.fetchRelevantData(task.query.parsedQuery);

      // Generate response using OpenAI
      const response = await this.generateResponse(task.query.rawQuery, data);

      return {
        success: true,
        result: response,
        format: "text",
      };
    } catch (error) {
      console.error("Error in GeneralAgent:", error);
      throw error;
    }
  }

  async fetchRelevantData(parsedQuery) {
    const { parameters, filters } = parsedQuery;

    // Build SQL query based on parameters and filters
    let query = "SELECT * FROM sales WHERE 1=1";
    const queryParams = [];

    if (filters.startDate) {
      query += " AND date >= ?";
      queryParams.push(filters.startDate);
    }

    if (filters.endDate) {
      query += " AND date <= ?";
      queryParams.push(filters.endDate);
    }

    // Execute query
    const [rows] = await this.db.query(query, queryParams);
    return rows;
  }

  async generateResponse(userQuery, data) {
    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that analyzes sales data and provides insights. Generate a clear, concise response.",
        },
        {
          role: "user",
          content: `Based on this sales data: ${JSON.stringify(
            data
          )}, ${userQuery}`,
        },
      ],
    });

    return response.choices[0].message.content;
  }
}

export default GeneralAgent;
