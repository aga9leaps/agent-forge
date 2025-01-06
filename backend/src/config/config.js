import "dotenv/config";

const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4",
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
};

export default config;
