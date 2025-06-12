import SQLDatabase from "../databases/sql.js";
import { formatContextArray } from "../utils/dataHandler.js";

export async function sqlSearchTool(sqlQuery) {
  try {
    console.log("Performing sql search for the query");

    const sqlClient = await SQLDatabase.getSqlConnection();
    const results = await sqlClient.query(sqlQuery);
    const formattedContext = formatContextArray(results);
    console.log("SQL search results count:", formattedContext.length);
    return formattedContext;
  } catch (error) {
    console.error("SQL search failed:", error);
    throw error;
  }
}
