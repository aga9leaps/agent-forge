import SQLDatabase from "../databases/sql.js";
import { openaiService } from "../serviceConfigs/OpenAIService.js";

export async function sqlQueryGenerationTool({ query, systemPrompt, model }) {
  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: query,
    },
  ];
  try {
    const result = await openaiService.chatCompletions(model, messages, []);
    let sqlQuery = result.choices[0].message.content;

    if (sqlQuery.startsWith("```sql") && sqlQuery.endsWith("```")) {
      sqlQuery = sqlQuery.substring(6, sqlQuery.length - 3).trim();
    }

    const sqlClient = await SQLDatabase.getSqlConnection();
    const data = await sqlClient.query(sqlQuery);

    return data;
  } catch (error) {
    console.error("SQL query execution failed:", error);
    throw error;
  }
}
