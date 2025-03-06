import "dotenv/config";

const config = {
  openai: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GPT4o: "gpt-4",
    GPT4oMINI: "gpt-4o-mini",
  },
  server: {
    PORT: process.env.PORT || 5000,
  },
  mongo: {
    MONGO_URI: `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGODB_NAME}?retryWrites=true&w=majority`,
    COLLECTION_NAMES: {
      mp_customers: "mp_customers",
      mp_tasks: "mp_tasks",
    },
  },
  sql: {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
  },
  zilliz: {
    ZILLIZ_URI: process.env.ZILLIZ_URI,
    ZILLIZ_TOKEN: process.env.ZILLIZ_TOKEN,
    COLLECTION_NAMES: {
      mp_vector_store: "magic_paints_with_summary",
    },
  },
  whatsApp: {
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
    MY_WHATSAPP_TOKEN: process.env.MY_WHATSAPP_TOKEN,
    WHATSAPP_ACCOUNT_ID: process.env.WHATSAPP_ACCOUNT_ID,
  },
};

export default config;
