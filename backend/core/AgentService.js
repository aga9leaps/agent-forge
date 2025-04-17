import ToolRegistry from "./ToolRegistry.js";
import { openaiService } from "./serviceConfigs/OpenAIService.js";

class AgentService {
  constructor(clientConfig) {
    this.toolRegistry = new ToolRegistry();
    this.clientConfig = clientConfig;
    this.tools = [];
  }

  async processRequest(systemPrompt, conversationHistory, consumer) {
    if (!this.clientConfig) {
      return "Client config not found";
    }
    await this.toolRegistry.loadClientTools(this.clientConfig);

    if (this.clientConfig && this.clientConfig.tools) {
      Object.entries(this.clientConfig.tools).forEach(
        ([toolName, toolInfo]) => {
          if (toolInfo.enabled && toolInfo.config && toolInfo.config.function) {
            this.tools.push({
              type: "function",
              function: toolInfo.config.function,
            });
          }
        }
      );
    }

    // Messages array contains the context for the model and converstaion history.
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversationHistory,
    ];

    const response = await openaiService.chatCompletions(
      this.clientConfig?.llm?.responseGenerationModel,
      messages,
      this.tools,
      this.clientConfig?.llm.responseGenerationTemperature
    );
    const generatedText = response.choices[0]?.message?.content || "";

    // Perform moderation check before returning response
    const isFlagged = await openaiService.moderations(generatedText);
    if (isFlagged) {
      return {
        generated_text:
          "I'm sorry, but I can't provide a response for that request.",
        context: null,
        tool_used: null,
      };
    }

    const toolCalls = response.choices[0]?.message?.tool_calls;

    if (toolCalls) {
      console.log("Tool calls detected, handling them...");

      conversationHistory.push(response.choices[0].message);
      return this.handleToolCalls(toolCalls, conversationHistory, consumer);
    }

    console.log("Returning GPT-4o response...");
    return response.choices[0]?.message?.content;
  }

  async handleToolCalls(toolCalls, conversationHistory, consumer, depth = 0) {
    console.log(`Handling tool calls at depth ${depth}...`);
    const MAX_RECURSION_DEPTH = 2;
    if (depth >= MAX_RECURSION_DEPTH) {
      console.warn("Reached maximum recursion depth. Returning response.");
      return {
        generated_text:
          "I'm unable to retrieve further information at this time.",
        context: null,
        tool_used: null,
      };
    }

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      try {
        const query = JSON.parse(toolCall.function.arguments);

        // Retrieve the tool instance dynamically from the registry.
        const toolInstance = this.toolRegistry.getTool(toolName);
        if (!toolInstance || typeof toolInstance.execute !== "function") {
          console.error(`Tool ${toolName} not found or not executable.`);
          continue;
        }

        const toolParams =
          this.clientConfig.tools[toolName]?.config.functionParams || {};
        const args = {
          query,
          toolParams,
        };

        // Execute the tool with the parsed arguments.
        const result = await toolInstance.execute({ ...args });
        conversationHistory.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id,
        });
      } catch (error) {
        console.error("Error processing tool call:", error);
        return {
          generated_text: "An error occurred while processing the request.",
          context: null,
          tool_used: null,
        };
      }
    }

    console.log("Generating new response with updated conversation history...");
    const newResponse = await openaiService.chatCompletions(
      this.clientConfig?.llm?.responseGenerationModel,
      conversationHistory,
      this.tools || [],
      this.clientConfig?.llm.responseGenerationTemperature || 0.7
    );

    // If the new response includes additional tool calls, handle them recursively.
    if (newResponse.choices[0]?.message?.tool_calls) {
      console.log("New tool calls detected, handling them recursively...");
      return this.handleToolCalls(
        newResponse.choices[0].message.tool_calls,
        conversationHistory,
        consumer,
        depth + 1
      );
    }

    console.log("Returning final response...");
    return newResponse.choices[0]?.message?.content;
  }
}

export default new AgentService();
