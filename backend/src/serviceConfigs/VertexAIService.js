import { VertexAI } from "@google-cloud/vertexai";
import { SpeechClient } from "@google-cloud/speech";
import authConfigs from "../../configs/setUp.json" with { type: "json" };

class VertexAIService {
  #vertexAI = null;
  #speechClient = null;

  async getVertexAIClient(model) {
    if (!this.#vertexAI) {
      this.#vertexAI = new VertexAI({
        project: authConfigs.project_id,
        location: 'us-central1',
        googleAuthOptions: {
          credentials: authConfigs,
          scopes: ["https://www.googleapis.com/auth/cloud-platform"],
          projectId: authConfigs.project_id,
        },
      });
    }

    return this.#vertexAI.getGenerativeModel({
      model: model,
    });
  }

  async getSpeechClient() {
    if (!this.#speechClient) {
      this.#speechClient = new SpeechClient({
        credentials: authConfigs,
        projectId: authConfigs.project_id,
      });
    }
    return this.#speechClient;
  }

  async imageAnalyser(model, imageBuffer, prompt) {
    try{
      const generativeVisionModel = await this.getVertexAIClient(model);
      
      const requestOptions = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inline_data: { data: imageBuffer, mimeType: "image/jpeg" } },
            ],
          },
        ],
      };
      const response =
        await generativeVisionModel.generateContent(requestOptions);

      let generatedText = response.response.candidates[0].content.parts[0].text
      generatedText = generatedText.replace(/```json|```/g, "").trim();

      return JSON.parse(response);
    }catch(error) {
      console.error("Error in generateResponseGPT4o:", error);
      return "Unable to generate response";
    }

  }


}

export const vertexAIService = new VertexAIService();
