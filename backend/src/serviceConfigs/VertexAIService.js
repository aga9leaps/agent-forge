import { VertexAI } from "@google-cloud/vertexai";
import { SpeechClient } from "@google-cloud/speech";
import dotenv from "dotenv";
dotenv.config({ path: "../../configs/.env" });
class VertexAIService {
  #vertexAI = null;
  #speechClient = null;

  async getVertexAIClient(model) {
    if (!this.#vertexAI) {
      this.#vertexAI = new VertexAI({
        project: process.env.GCS_PROJECT_ID,
        location: 'us-central1',
        googleAuthOptions: {
          scopes: ["https://www.googleapis.com/auth/cloud-platform"],
          projectId: process.env.GCS_PROJECT_ID,
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
        projectId: process.env.GCS_PROJECT_ID,
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
