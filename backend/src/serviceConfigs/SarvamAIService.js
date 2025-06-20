import FormData from "form-data";
import axios from "axios";

class SarvamAIService {
  constructor() {
    this.apiKey =
      process.env.SARVAM_API_KEY || "2f02fdb1-5ba1-4392-bcc1-80e63b885647";

    if (!this.apiKey) {
      console.warn(
        "SARVAM_API_KEY environment variable not set, using default key"
      );
    }
  }

  async sttAndTarnslateAudio(fileBuffer) {
    try {
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error("Invalid audio file buffer");
      }

      console.log(
        "Sending audio to Sarvam AI, buffer size:",
        fileBuffer.length
      );

      const form = new FormData();
      form.append("model", "saaras:v2");
      form.append("with_diarization", "false");
      form.append("num_speakers", "123");
      form.append("file", fileBuffer, {
        filename: "audio.wav",
        contentType: "audio/wav",
      });

      const response = await axios.post(
        "https://api.sarvam.ai/speech-to-text-translate",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...form.getHeaders(),
            "api-subscription-key": this.apiKey,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log("Sarvam AI response status:", response.status);
      console.log("Sarvam AI response data:", response.data);

      // Check if response has the expected structure
      if (!response.data) {
        throw new Error("No response data from Sarvam AI service");
      }

      // The response structure is directly in response.data, not response.data.data
      if (!response.data.transcript) {
        console.log("Response structure:", Object.keys(response.data));
        throw new Error("No transcript found in Sarvam AI response");
      }

      return {
        transcript: response.data.transcript,
        language_code: response.data.language_code,
        request_id: response.data.request_id,
        diarized_transcript: response.data.diarized_transcript,
      };
    } catch (error) {
      if (error.response) {
        console.error("SarvamAI API Error:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });

        const errorMessage =
          error.response.data?.error?.message ||
          error.response.data?.message ||
          "Unknown error";
        throw new Error(
          `Sarvam AI API error (${error.response.status}): ${errorMessage}`
        );
      } else if (error.request) {
        console.error("SarvamAI Network Error:", error.message);
        throw new Error("Network error connecting to Sarvam AI service");
      } else {
        console.error("SarvamAI Error:", error.message);
        throw new Error(`Failed to process audio file: ${error.message}`);
      }
    }
  }
}

export const sarvamAiService = new SarvamAIService();
