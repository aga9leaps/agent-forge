import { translationService } from "../services/TranslationService.js";

export const translateText = async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Text and target language are required",
      });
    }

    const translatedText = await translationService.translateText(
      text,
      targetLanguage,
      sourceLanguage || "auto"
    );

    res.json({
      success: true,
      originalText: text,
      translatedText,
      sourceLanguage: sourceLanguage || "auto",
      targetLanguage,
    });
  } catch (error) {
    console.error("Translation controller error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Translation failed",
    });
  }
};

export const translateMessages = async (req, res) => {
  try {
    const { messages, targetLanguage, sourceLanguage } = req.body;

    if (!messages || !Array.isArray(messages) || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Messages array and target language are required",
      });
    }

    // Extract text from messages
    const textsToTranslate = messages
      .map((msg) => msg.text)
      .filter((text) => text && text.trim());

    if (textsToTranslate.length === 0) {
      return res.json({
        success: true,
        translatedMessages: messages, // Return original if no text to translate
      });
    }

    // Translate all texts at once for efficiency
    const translatedTexts = await translationService.translateText(
      textsToTranslate,
      targetLanguage,
      sourceLanguage || "auto"
    );

    // Map translations back to messages
    let textIndex = 0;
    const translatedMessages = messages.map((msg) => {
      if (msg.text && msg.text.trim()) {
        return {
          ...msg,
          text: translatedTexts[textIndex++],
          originalText: msg.text, // Keep original for reference
          isTranslated: true,
        };
      }
      return msg;
    });

    res.json({
      success: true,
      translatedMessages,
      targetLanguage,
      sourceLanguage: sourceLanguage || "auto",
    });
  } catch (error) {
    console.error("Messages translation controller error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Messages translation failed",
    });
  }
};

export const detectLanguage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Text is required for language detection",
      });
    }

    const detection = await translationService.detectLanguage(text);

    res.json({
      success: true,
      ...detection,
    });
  } catch (error) {
    console.error("Language detection controller error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Language detection failed",
    });
  }
};

export const getSupportedLanguages = async (req, res) => {
  try {
    const languages = await translationService.getSupportedLanguages();

    res.json({
      success: true,
      languages,
    });
  } catch (error) {
    console.error("Get supported languages controller error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get supported languages",
    });
  }
};
