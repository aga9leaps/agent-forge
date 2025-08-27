// Generic system constants
// All business-specific constants should be loaded from configuration files

// AI Model Constants (Provider-agnostic)
const MODELS = {
  GPT_4: "gpt-4",
  GEMINI_MODEL: "gemini-2.0-flash-001",
  EMBEDDING_MODEL: "text-embedding-3-small",
};

// Generic Image Classification Prompt
const IMAGE_CLASSIFICATION_PROMPT = `
  Analyze the given image and classify it into one of the following categories:  
  1. invoice_image – If the image contains a structured financial document like an invoice, bill, or receipt.  
  2. product_image – If the image contains a product photo, such as an item for sale or an object displayed clearly.  
  3. document_image – If the image contains a general document, such as a form, letter, or official paperwork.

  Return the response in JSON format with two fields:  
  - imageType: The classified type of the image from the given categories.  
  - shortDescription: A two-sentence summary starting with "Thank you for providing us with the image of *imageType*", followed by a brief description of its content.  

  Example Response:  
  {
    "imageType": "invoice_image",
    "shortDescription": "Thank you for providing us with the image of invoice_image. This appears to be a financial document, likely containing details of a transaction, such as prices and itemized information."
  }`;

// Generic Reminder Phase Structure
// These can be customized per business context
const GENERIC_REMINDER_PHASES = {
  "Phase 1": {
    multiplier: 0.55,
    type: "educational",
    priority: "low",
    channel: "text"
  },
  "Phase 2": {
    multiplier: 0.75,
    type: "awareness",
    priority: "medium",
    channel: "text"
  },
  "Phase 3": {
    multiplier: 0.9,
    type: "reminder",
    priority: "medium",
    channel: "multi"
  },
  "Phase 4": {
    multiplier: 1.05,
    type: "urgent",
    priority: "high",
    channel: "voice_then_text"
  },
  "Phase 5": {
    multiplier: 1.2,
    type: "critical",
    priority: "critical",
    channel: "personal"
  }
};

// Generic Reminder Categories
const GENERIC_REMINDER_CATEGORIES = [
  {
    frequency: "very_high",
    regularity: "very_regular",
    precision: "high",
    tolerance_days: 2
  },
  {
    frequency: "high",
    regularity: "regular",
    precision: "medium_high",
    tolerance_days: 5
  },
  {
    frequency: "high",
    regularity: "irregular",
    precision: "medium",
    tolerance_days: 7
  },
  {
    frequency: "medium",
    regularity: "regular",
    precision: "medium",
    tolerance_days: 5
  },
  {
    frequency: "medium",
    regularity: "irregular",
    precision: "low",
    tolerance_days: 10
  },
  {
    frequency: "low",
    regularity: "regular",
    precision: "medium",
    tolerance_days: 5
  },
  {
    frequency: "low",
    regularity: "irregular",
    precision: "low",
    tolerance_days: 10
  }
];

// System-wide Constants
const SYSTEM_CONSTANTS = {
  DEFAULT_LANGUAGE: "en",
  DEFAULT_TIMEZONE: "UTC",
  DEFAULT_CURRENCY: "USD",
  MAX_RETRY_ATTEMPTS: 3,
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  DEFAULT_PAGE_SIZE: 20,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  SUPPORTED_DOCUMENT_TYPES: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  API_VERSION: "v1"
};

// Export all constants
export {
  MODELS,
  IMAGE_CLASSIFICATION_PROMPT,
  GENERIC_REMINDER_PHASES,
  GENERIC_REMINDER_CATEGORIES,
  SYSTEM_CONSTANTS
};

// Legacy exports for backward compatibility
// These will be removed after full refactoring
export const reminderPhases = GENERIC_REMINDER_PHASES;
export const reminderCategoryRules = GENERIC_REMINDER_CATEGORIES;

// Legacy system prompt - will be removed after service refactoring
export const SYSTEM_PROMPT = "You are a helpful AI assistant. Please provide accurate and helpful responses.";

// Legacy discounts data - will be removed after service refactoring
export const DISCOUNTS_DATA = [
  "Contact us for current offers and promotions.",
  "Special discounts available for bulk orders.",
  "Seasonal offers may apply - please inquire."
];