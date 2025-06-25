# Translation and Speech-to-Text Integration

This document explains the enhanced translation and speech-to-text features integrated with the finance bot.

## Features Added

### 1. Translation-Enabled Chat

The chat endpoint now supports automatic translation for multilingual conversations.

**Endpoint**: `POST /finance-bot/chat`
**Headers**: `Authorization: Bearer <token>`
**Body**:

```json
{
  "message": "Hello, show me profit report",
  "targetLanguage": "es" // Optional: Spanish, French, German, etc.
}
```

**Response**:

```json
{
  "reply": "Hola, aquí está su reporte de ganancias...",
  "originalLanguage": "en",
  "targetLanguage": "es",
  "wasTranslated": true,
  "downloadUrl": "https://..."
}
```

### 2. Enhanced Speech-to-Text

Two speech-to-text endpoints are available:

#### Basic Speech-to-Text

**Endpoint**: `POST /finance-bot/speech-to-text`
**Content-Type**: `multipart/form-data`
**Fields**:

- `audio`: Audio file (max 10MB)
- `language`: Target language code (optional, defaults to "en")

**Response**:

```json
{
  "success": true,
  "transcript": "Show me the profit report for April",
  "language": "en",
  "processedAsChat": false
}
```

#### Speech-to-Text with Chat Processing

**Endpoint**: `POST /finance-bot/speech-to-text-chat`
**Headers**: `Authorization: Bearer <token>`
**Content-Type**: `multipart/form-data`
**Fields**:

- `audio`: Audio file (max 10MB)
- `language`: Target language code (optional, defaults to "en")

**Response**:

```json
{
  "success": true,
  "transcript": "Muéstrame el reporte de ganancias de abril",
  "language": "es",
  "chatResponse": {
    "reply": "Aquí está su reporte de ganancias...",
    "downloadUrl": "https://...",
    "wasTranslated": true
  },
  "processedAsChat": true
}
```

### 3. Translated Chat History

Get chat history in any supported language.

**Endpoint**: `GET /finance-bot/history?targetLanguage=es`
**Headers**: `Authorization: Bearer <token>`

**Response**:

```json
{
  "messages": [
    {
      "from": "user",
      "text": "Hola",
      "originalText": "Hello",
      "isTranslated": true
    },
    {
      "from": "bot",
      "text": "¿Cómo puedo ayudarte?",
      "originalText": "How can I help you?",
      "isTranslated": true
    }
  ],
  "targetLanguage": "es",
  "wasTranslated": true
}
```

### 4. Translation Utilities

Direct translation endpoints for text and messages:

#### Translate Text

**Endpoint**: `POST /translate/text`
**Body**:

```json
{
  "text": "Hello world",
  "targetLanguage": "es",
  "sourceLanguage": "en" // optional
}
```

#### Detect Language

**Endpoint**: `POST /translate/detect-language`
**Body**:

```json
{
  "text": "Hola mundo"
}
```

#### Get Supported Languages

**Endpoint**: `GET /translate/supported-languages`

## Supported Languages

The system supports all languages supported by Google Cloud Translate API, including:

- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Arabic (ar)
- Russian (ru)
- Hindi (hi)
- And many more...

## How It Works

1. **User Input Translation**: When a user sends a message in a non-English language, it's automatically detected and translated to English for processing by the finance bot.

2. **Response Translation**: The bot's English response is then translated back to the user's target language.

3. **Chat History Storage**: Both original and translated messages are stored, allowing for consistent multilingual conversations.

4. **Speech Integration**: Audio input is transcribed in the specified language and can optionally be processed through the chat system automatically.

## Error Handling

- If translation fails, the system falls back to the original language
- Audio files are validated for size and format
- All errors include translated error messages when possible

## Authentication

- Chat endpoints require authentication tokens
- Basic speech-to-text works without authentication
- Speech-to-text with chat processing requires authentication

## Usage Examples

### Multilingual Voice Chat Flow

1. User speaks in Spanish
2. Audio is sent to `/finance-bot/speech-to-text-chat` with `language=es`
3. System transcribes Spanish audio
4. Transcription is processed as chat message
5. English response is generated and translated back to Spanish
6. User receives Spanish response

### Text Chat with Translation

1. User sends message in French with `targetLanguage=fr`
2. Message is translated to English for processing
3. Finance bot generates English response
4. Response is translated to French
5. User receives French response
6. Chat history is maintained in both languages
