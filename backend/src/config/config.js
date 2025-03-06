import "dotenv/config";

const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    gpt4Model: "gpt-4",
    gpt4MiniModel: "gpt-4o-mini",
  },
  server: {
    port: process.env.PORT || 5000,
  },
  sql: {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
  },
  systemPrompt: {},
};

export default config;
