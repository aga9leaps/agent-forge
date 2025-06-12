import authConfigs from "../../configs/setUp.json" with { type: "json" };
import { vertexAIService } from "../serviceConfigs/VertexAIService.js";

class STTService {
  constructor() {
    this.location = "us-central1";
  }

  // Recognizer creation for STT v2
  async createRecognizer(model) {
    try {
      const client = await vertexAIService.getSpeechClient();
      const recognizerId = 'am-fixed-multilingual-recognizer';
      const parent = `projects/${authConfigs.project_id}/locations/${this.location}`;
      const languageCodes = ['en-US', 'kn-IN', 'hi-IN', 'ta-IN', 'te-IN', 'ml-IN'];

      const request = {
          parent: parent,
          recognizerId: recognizerId,
          recognizer: {
              defaultRecognitionConfig: {
                  languageCodes: languageCodes, 
                  model: model
              },
          },
      };

      try {
          const [operation] = await client.createRecognizer(request);
          await operation.promise(); 
          console.log('Fixed multilingual recognizer created:', recognizerId);
          return recognizerId;
      } catch (error) {
          if (error.message.includes('ALREADY_EXISTS')) {
              console.log('Fixed multilingual recognizer already exists:', recognizerId);
              return recognizerId;
          } else {
              throw error;
          }
      }

  } catch (error) {
      console.error('Error creating fixed multilingual recognizer:', error);
      throw new Error(`Failed to create recognizer: ${error.message}`);
  }
  }

  async transcribeAudioV1(audioBuffer, configOverrides = {}) {
    try {
      const client = await vertexAIService.getSpeechClient();
      const config = {
        encoding: "LINEAR16",
        languageCode: "en-US",
        audioChannelCount: 1,
        enableSeparateRecognitionPerChannel: false,
        ...configOverrides,
      };

      const audio = { content: audioBuffer };
      const request = { audio, config };

      const [response] = await client.recognize(request);
      if (!response || !response.results) {
        throw new Error(
          "No transcription results received from Speech-to-Text API."
        );
      }
      return response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
    } catch (error) {
      console.error("Error in transcribeAudioV1:", error);
      throw new Error(
        `Speech-to-Text V1 transcription failed: ${error.message}`
      );
    }
  }

  async transcribeAudioV2(audioBuffer, recognitionConfig = {}) {
    try {
        const client = await vertexAIService.getSpeechClient();
        const recognizerName = `projects/${authConfigs.project_id}/locations/${this.location}/recognizers/am-fixed-multilingual-recognizer`;
        const languageCodes = ['en-US', 'kn-IN', 'hi-IN', 'ta-IN', 'te-IN', 'ml-IN']; 

        const request = {
            recognizer: recognizerName,
            config: {
                autoDecodingConfig: {},
                languageCodeSettings: languageCodes.map(code => ({ languageCode: code })),
                ...recognitionConfig,
            },
            audio: { content: audioBuffer },
        };

        const [response] = await client.recognize(request);
        if (!response || !response.results) {
            throw new Error('No transcription results received from Speech-to-Text V2 API.');
        }

        let fullTranscript = "";
        for (const result of response.results) {
            for (const alternative of result.alternatives) {
                fullTranscript += alternative.transcript + " ";
            }
            fullTranscript += "\n";
        }
        return fullTranscript.trim();

    } catch (error) {
        console.error('Error in transcribeAudioV2:', error);
        throw new Error(`Speech-to-Text V2 transcription failed: ${error.message}`);
    }
}
}

export const sttService = new STTService();
