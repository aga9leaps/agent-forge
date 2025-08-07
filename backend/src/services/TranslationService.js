import { v2 as translate } from '@google-cloud/translate';
import dotenv from "dotenv";
dotenv.config({ path: "../../configs/.env" });
class TranslationService {
  #translateClient = null;

  async getTranslateClient() {
    if (!this.#translateClient) {
      this.#translateClient = new translate.Translate({
        credentials: {
          client_email: process.env.GCS_CLIENT_EMAIL,
          private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
        projectId: process.env.GCS_PROJECT_ID,
      });
    }
    return this.#translateClient;
  }

  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    try {
      const translateClient = await this.getTranslateClient();
      
      // Handle arrays of texts
      const textsToTranslate = Array.isArray(text) ? text : [text];
      
      // Use the correct API parameters for Google Cloud Translate v2
      const [translations] = await translateClient.translate(textsToTranslate, targetLanguage);

      // Return single translation if input was a string, array if input was array
      return Array.isArray(text) ? translations : translations[0];
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  async detectLanguage(text) {
    try {
      const translateClient = await this.getTranslateClient();
      const [detection] = await translateClient.detect(text);
      
      return {
        language: detection.language,
        confidence: detection.confidence
      };
    } catch (error) {
      console.error('Language detection error:', error);
      throw new Error(`Language detection failed: ${error.message}`);
    }
  }

  async getSupportedLanguages() {
    try {
      const translateClient = await this.getTranslateClient();
      const [languages] = await translateClient.getLanguages();
      return languages;
    } catch (error) {
      console.error('Error getting supported languages:', error);
      throw new Error(`Failed to get supported languages: ${error.message}`);
    }
  }
}

export const translationService = new TranslationService();
