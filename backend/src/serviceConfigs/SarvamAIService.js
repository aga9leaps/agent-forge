import FormData from "form-data";
import axios from "axios";

class SarvamAIService {
  constructor() {
    this.apiKey = "2d81b07b-97df-4cd7-9d1a-20ac94249e95";
  }

  async sttAndTarnslateAudio(fileBuffer) {
    try {
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
        }
      );
      return response.data.data;
    } catch (error) {
      console.log("Error", error.response);
      throw new Error("Failed to process audio file: ", error.message);
    }
  }
}

export const sarvamAiService = new SarvamAIService();
