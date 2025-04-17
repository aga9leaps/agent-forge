import { readFile } from "fs/promises";
import { z } from "zod";

const ClientSchema = z.object({
  id: z.string(),
  tools: z.record(
    z.object({
      enabled: z.boolean(),
      module: z.string(),
      config: z.record(z.any()).optional(),
    })
  ),
  prompts: z.any(),
  databases: z.any(),
  llm: z.any(),
});

class ClientSchemaService {
  static #cache = new Map();

  static async getConfig(clientId) {
    if (this.#cache.has(clientId)) {
      return this.#cache.get(clientId);
    }

    try {
      const config = JSON.parse(
        await readFile(`./configs/clients/${clientId}.json`)
      );
      const validated = ClientSchema.parse(config);

      this.#cache.set(clientId, validated);
      return validated;
    } catch (error) {
      throw new Error(`Config error for ${clientId}: ${error.message}`);
    }
  }
}

export default ClientSchemaService;
