import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });

export default class MilvusDatabase {
  static async createClient() {
    if (!this.milvusClient) {
      const address = process.env.ZILLIZ_URI;
      const token = process.env.ZILLIZ_TOKEN;
      this.milvusClient = new MilvusClient({ address, token });
    }

    return this.milvusClient;
  }

  static async getMilvusClient() {
    if (!this.milvusClient) {
      this.milvusClient = await this.createClient();
    }
    return this.milvusClient;
  }
}
