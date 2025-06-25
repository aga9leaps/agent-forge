import { openaiService } from "../serviceConfigs/OpenAIService.js";
import {
  VECTOR_SEARCH_TOOL,
  RATIO_ANALYSIS_REPORT_TOOL,
  PROFIT_LOSS_REPORT_TOOL,
  CASH_FLOW_STATEMENT_REPORT_TOOL,
  CASH_FLOW_PROJECTION_REPORT_TOOL,
  EXPENSE_ANALYSIS_REPORT_TOOL,
  EXTRACT_METRIC_TOOL
} from "../agentTools/toolsDefinition.js";
import { toolSelector } from "../agentTools/toolCalls.js";
import financeChatRepository from "../repository/financeChatRepository.js";
import { extractDateRangeFromMessage } from "../utils/dateExtractor.js";

const SYSTEM_PROMPT = `You are a helpful financial analytics assistant for Magic Paints.
You can answer questions, generate financial reports, and provide specific financial metrics or values.
If a user asks for a specific metric or value (like profit margin, current ratio, etc.), use the extractMetric tool to get just that value.
If a user asks for a full report, use the appropriate report generation tool to provide a download link.
If the user asks a general finance question, answer conversationally.
Always infer the most likely date range if the user provides a partial date (e.g., "June 2023" means from June 1, 2023 to June 30, 2023; "2023" means the full year).
Never ask the user to clarify the date range if it can be reasonably inferred.
Always extract full date ranges explicitly. 
If user writes a single day like “August 25”, always treat it as "from 2023-08-25 to 2023-08-25".
Never confuse August with April. Match exact month names or abbreviations (e.g., Aug = August).
`;

const TOOLS = [
  VECTOR_SEARCH_TOOL,
  EXTRACT_METRIC_TOOL,
  RATIO_ANALYSIS_REPORT_TOOL,
  PROFIT_LOSS_REPORT_TOOL,
  CASH_FLOW_STATEMENT_REPORT_TOOL,
  CASH_FLOW_PROJECTION_REPORT_TOOL,
  EXPENSE_ANALYSIS_REPORT_TOOL
];

class FinanceBotService {
  async handleChat(message, username) {
    // 1. Get chat history for context
    const history = await financeChatRepository.getHistory(username);

    // 2. Save user message
    await financeChatRepository.saveConversation(username, "user", message);
    let userMessage = message; // original user message
    try{
    const dateRange = extractDateRangeFromMessage(userMessage);
    if (dateRange) {
      // Option 1: Append to message for LLM context
      userMessage += ` [Parsed Date Range: ${dateRange.from} to ${dateRange.to}]`;
    }
    // 3. Prepare conversation for LLM
    const conversation = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: userMessage }
    ];

    // 4. Call OpenAI with tools enabled
    const response = await openaiService.chatCompletions({
      model: "gpt-4o",
      messages: conversation,
      tools: TOOLS,
      tool_choice: "auto",
      temperature: 0.3
    });

    const assistantMsg = response.choices?.[0]?.message;
    let reply = assistantMsg?.content || "";
    let downloadUrl;    // 5. If LLM wants to call a tool (function), do it!
    if (assistantMsg?.tool_calls?.length) {
      for (const toolCall of assistantMsg.tool_calls) {
        const toolName = toolCall.function.name;
        const params = JSON.parse(toolCall.function.arguments);
        const toolResult = await toolSelector(toolName, params);

        console.log(`Tool ${toolName} returned:`, JSON.stringify(toolResult));        if (toolName === "extractMetric" && toolResult?.message) {
          // For metric extraction, use the formatted message directly
          if (toolResult.value && toolResult.metricName) {
            // Clean up any potential HTML tags in the value
            const cleanValue = toolResult.value.replace(/<[^>]*>/g, '');
            const cleanMetricName = toolResult.metricName.replace(/<[^>]*>/g, '');
            
            // Extract the date range from the message
            const dateRangeMatch = toolResult.message.match(/from (.+?) to (.+?),/);
            const fromDate = dateRangeMatch?.[1] || '';
            const toDate = dateRangeMatch?.[2] || '';
            
            // Create a clean response message without HTML tags
            reply = `Based on the ${toolResult.reportSource} from ${fromDate} to ${toDate}, the ${cleanMetricName} is ${cleanValue}.

You can view the full report using the link below for verification.`;
          } else {
            // Make sure the message doesn't have HTML tags
            reply = toolResult.message.replace(/<[^>]*>/g, '');
          }
          
          if (toolResult?.downloadUrl) {
            downloadUrl = toolResult.downloadUrl;
          }
        }else if (toolResult?.downloadUrl) {
          // For standard report generation
          downloadUrl = toolResult.downloadUrl;
          reply += `Access your report using the link provided below.`;
        } else if (typeof toolResult === "string") {
          reply += `\n\n${toolResult}`;
        } else if (toolResult?.message) {
          // Generic fallback for any tool that returns a message
          reply = toolResult.message;
        }
      }
    }    // 6. Save assistant response with downloadUrl if available
    await financeChatRepository.saveConversation(username, "assistant", reply, false, downloadUrl);

    return {
      reply: reply || "I'm sorry, I couldn't process your request.",
      downloadUrl
    };
     } catch (error) {
    // NEW ERROR HANDLING: Save the error response to MongoDB
    console.error("FinanceBot error:", error);
    const errorMessage = "I encountered an issue processing your request. Please try again.";
    
    // Save the error message to MongoDB
    try {
      await financeChatRepository.saveConversation(username, "assistant", errorMessage);
    } catch (saveError) {
      console.error("Error saving error message to MongoDB:", saveError);
    }
    
    return {
      reply: errorMessage,
      error: true
    };
  }
 }
}


export default new FinanceBotService();
