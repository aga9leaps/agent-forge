import MongoDatabase from "../databases/mongo.js";

class BaseMongoRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async getCollection() {
    if (!this.db) {
      this.db = await MongoDatabase.getDatabase();
    }
    return this.db.collection(this.collectionName);
  }

  async insertOne(document) {
    const collection = await this.getCollection();
    return collection.insertOne(document);
  }

  async findOne(query) {
    const collection = await this.getCollection();
    return collection.findOne(query);
  }

  async find(query = {}, options = {}) {
    const collection = await this.getCollection();
    return collection.find(query, options).toArray();
  }

  async updateOne(filter, update, options = {}) {
    const collection = await this.getCollection();
    return collection.updateOne(filter, update, options);
  }

  async deleteOne(filter) {
    const collection = await this.getCollection();
    return collection.deleteOne(filter);
  }
}

export default BaseMongoRepository;
