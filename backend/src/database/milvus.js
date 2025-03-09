import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import config from "../Config/config.js";

export default class MilvusClient {
  static createClient() {
    const address = config.zilliz.ZILLIZ_URI;
    const token = config.zilliz.ZILLIZ_TOKEN;
    return new MilvusClient({ address, token });
  }
}
