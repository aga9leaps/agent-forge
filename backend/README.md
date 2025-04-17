# Magic Paints AI Agent Backend

## Overview

The **Magic Paints AI Agent Backend** is a robust system designed to support AI-driven functionalities for Magic Paints and other clients. It integrates multiple tools, databases, and AI services to provide intelligent responses, data retrieval, and automation. The backend is modular, allowing easy customization for different clients and use cases.

---

## Functionalities

### 1. **Tool Registry**

- Dynamically loads and manages tools based on client configurations.
- Tools include:
  - **Vector Search Tool**: Retrieves data from a vector database using embeddings.
  - **SQL Search Tool**: Executes SQL queries to fetch structured data.
  - **SQL Query Generation Tool**: Converts natural language queries into SQL queries.

### 2. **Database Integrations**

- **SQL Database**: Manages structured data using MySQL.
- **MongoDB**: Handles unstructured and semi-structured data.
- **Milvus**: Supports vector-based searches for embeddings.

### 3. **AI Services**

- **OpenAI Integration**:
  - Chat completions for generating responses.
  - Embedding generation for vector searches.
  - Moderation to ensure safe and appropriate responses.
- **Google Vertex AI**:
  - Generative models for advanced AI tasks.
  - Speech-to-text (STT) for audio transcription.
  - Image analysis for classifying and extracting insights from images.

### 4. **Client-Specific Configurations**

- Each client has a dedicated configuration file (e.g., `magic_paints.json`, `jockey.json`) that defines:
  - Enabled tools and their parameters.
  - Database connections and collections.
  - Prompts and response generation settings.
  - LLM configurations (e.g., model, temperature).

### 5. **WhatsApp Integration**

- Sends messages, templates, and media via the WhatsApp Business API.
- Retrieves media details and converts them to base64 for further processing.

### 6. **Speech-to-Text (STT) Service**

- Converts audio files into text using Google Vertex AI's Speech API.
- Supports audio format conversion using FFmpeg.

### 7. **Data Formatting Utilities**

- Formats data for consistent and readable outputs.
- Handles complex nested objects and arrays.

### 8. **Agent Service**

- Processes user requests by:
  - Generating responses using OpenAI.
  - Dynamically invoking tools based on the conversation context.
  - Handling tool calls recursively for multi-step queries.

---

## Requirements for New Developers

### 1. **System Requirements**

- **Node.js**: Version 16 or higher.
- **MySQL**: For SQL database operations.
- **MongoDB**: For unstructured data storage.
- **Milvus**: For vector database operations.
- **FFmpeg**: For audio format conversion.

### 2. **Environment Setup**

- Clone the repository:
  ```bash
  git clone https://github.com/your-repo/magic-paints-ai-agent.git
  cd magic-paints-ai-agent/backend
  ```
- Install dependencies:
  ```bash
  npm install
  ```
- Configure environment variables:
  - Copy the [.env](http://_vscodecontentref_/0) file from the `configs` directory and update the values as needed.
  - Example:
    ```env
    OPENAI_API_KEY=your_openai_api_key
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=password
    MONGO_URI=your_mongo_uri
    ZILLIZ_URI=your_zilliz_uri
    WHATSAPP_TOKEN=your_whatsapp_token
    ```

### 3. **Key Files and Directories**

- **`core/`**: Contains core services, tools, and utilities.
  - [AgentService.js](http://_vscodecontentref_/1): Main service for processing user requests.
  - [ToolRegistry.js](http://_vscodecontentref_/2): Manages dynamic tool loading.
  - `serviceConfigs/`: Integrations with external services like OpenAI and Vertex AI.
  - [databases/](http://_vscodecontentref_/3): Database connection and management logic.
- **`configs/`**: Stores client-specific configurations and environment files.
- **`utils/`**: Utility functions for data formatting, HTTP requests, etc.
- **[tools/](http://_vscodecontentref_/4)**: Implements tools like vector search and SQL query generation.

### 4. **Running the Application**

- Start the backend server:
  ```bash
  node App.js
  ```
- Ensure all required services (MySQL, MongoDB, Milvus) are running.

### 5. **Testing**

- Currently, no automated tests are defined. You can add tests by modifying the `scripts` section in [package.json](http://_vscodecontentref_/5).

---

## Adding a New Client

1. **Create a Configuration File**:

   - Add a new JSON file in the `configs/clients/` directory.
   - Define tools, prompts, databases, and LLM settings.

2. **Enable Required Tools**:

   - Update the [tools](http://_vscodecontentref_/6) section in the configuration file to enable or disable tools.

3. **Test the Configuration**:
   - Load the client configuration using [ConfigLoader.js](http://_vscodecontentref_/7).
   - Verify tool execution and response generation.

---

## Key Dependencies

- **Node.js Modules**:
  - `express`: For building the backend server.
  - [axios](http://_vscodecontentref_/8): For making HTTP requests.
  - [dotenv](http://_vscodecontentref_/9): For managing environment variables.
  - `mysql2`: For SQL database operations.
  - `mongodb`: For MongoDB integration.
  - `@zilliz/milvus2-sdk-node`: For Milvus vector database operations.
  - `@google-cloud/speech`: For speech-to-text functionality.
  - `@google-cloud/vertexai`: For Google Vertex AI integration.
  - `openai`: For OpenAI API integration.

---

## Known Issues and Limitations

- **Tool Recursion Depth**: The agent service limits tool call recursion to a depth of 2 to prevent infinite loops.
- **Environment Variables**: Ensure all required variables are set in the [.env](http://_vscodecontentref_/10) file to avoid runtime errors.
- **Testing**: Automated tests are not implemented. Manual testing is required for new features.

---

## Future Enhancements

- Add automated testing for tools and services.
- Implement a centralized logging system.
- Enhance error handling and validation.
- Add support for additional AI models and tools.
