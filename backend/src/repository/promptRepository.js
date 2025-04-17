import BaseMongoRepository from "../../core/baseRepository/baseMongoRepository.js";

export default class PromptRepository extends BaseMongoRepository {
  constructor(collectionName) {
    super(collectionName);
  }

  async getActivePrompt(type) {
    const activePrompt = await this.findOne({ type, isActive: true });
    if (!activePrompt) {
      throw new Error("No active prompt found");
    }
    return activePrompt?.prompt;
  }
}
