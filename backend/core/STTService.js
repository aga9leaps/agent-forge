import fs from "fs";
import path from "path";
import { exec } from "child_process";
import util from "util";
import { fileURLToPath } from "url";
import { vertexAIService } from "./serviceConfigs/VertexAIService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = util.promisify(exec);

class STTService {
  constructor() {
    this.tempDir = path.join(__dirname, "../temp");
  }

  async transcribeAudio(mediaBase64) {
    let inputPath = null;
    let outputPath = null;

    try {
      // Ensure temp directory exists
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      // Create temp file paths
      const timestamp = Date.now();
      inputPath = path.join(this.tempDir, `audio-${timestamp}.ogg`);
      outputPath = path.join(this.tempDir, `audio-${timestamp}_mono.wav`);

      // Save original audio
      fs.writeFileSync(inputPath, Buffer.from(mediaBase64, "base64"));

      // Convert audio format
      await this._convertAudio(inputPath, outputPath);

      // Get transcription
      const transcription = await this._recognizeAudio(outputPath);

      // Cleanup
      this._cleanupFiles([inputPath, outputPath]);

      return transcription;
    } catch (error) {
      // Cleanup if paths were created
      this._cleanupFiles([inputPath, outputPath].filter(Boolean));
      throw error;
    }
  }

  async _convertAudio(inputPath, outputPath) {
    try {
      await execPromise(
        `ffmpeg -i "${inputPath}" -ac 1 -ar 44100 "${outputPath}"`
      );
      return outputPath;
    } catch (error) {
      throw new Error(`Audio conversion failed: ${error.message}`);
    }
  }

  async _recognizeAudio(audioBuffer) {
    try {
      // const audioBytes = fs.readFileSync(filePath).toString("base64");

      const request = {
        audio: { content: audioBuffer },
        config: {
          encoding: "LINEAR16",
          // sampleRateHertz: 44100,
          audioChannelCount: 1,
          enableSeparateRecognitionPerChannel: false,
        },
      };

      const speechClient = await vertexAIService.getSpeechClient();
      const [response] = await speechClient.recognize(request);

      return response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
    } catch (error) {
      throw new Error(`Speech recognition failed: ${error.message}`);
    }
  }

  _cleanupFiles(files) {
    files.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  }
}

export const sttService = new STTService();
