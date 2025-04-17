import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });

class OpenAIService {
  constructor(apiKey) {
    this.openaiClient = new OpenAI({ apiKey });
  }

  async chatCompletions(
    model,
    messages,
    tools,
    temperature = 0.7,
    tool_choice = "auto",
    response_format = null,
    responseStructure = null
  ) {
    try {
      const requestOptions = {
        model,
        messages,
        tools,
        tool_choice,
        temperature,
      };

      // Dynamically add response_format to the request options if it is provided
      if (response_format) {
        if (responseStructure) {
          requestOptions.response_format = zodResponseFormat(
            responseStructure,
            "response"
          );
        } else {
          console.error(
            "responseStructure is required when response_format is provided"
          );
          return;
        }
      }

      const response = await this.openaiClient.chat.completions.create(
        requestOptions
      );

      return response;
    } catch (error) {
      console.error("Error in generateResponseGPT4o:", error);
      return "Unable to generate response";
    }
  }

  async moderations(content) {
    try {
      const moderationResponse = await this.openaiClient.moderations.create({
        input: content,
      });

      const flagged = moderationResponse.results.some(
        (result) => result.flagged
      );

      return flagged;
    } catch (error) {
      console.error("Error in moderation check:", error);
      return false;
    }
  }

  async embedding(inputs, model) {
    try {
      const embedding = await this.openaiClient.embeddings.create({
        model: model,
        input: inputs,
      });

      return embedding.data[0].embedding;
    } catch (error) {
      console.error("Error in generating embedding:", error);
      return false;
    }
  }
}

export const openaiService = new OpenAIService(process.env.OPENAI_API_KEY);
