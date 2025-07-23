import BaseMongoRepository from "./baseRepository/baseMongoRepository.js";

export default class MPConsumersRepository extends BaseMongoRepository {
  constructor(collectionName = 'mp_consumers') {
    super(collectionName);
  }

  async findAll() {
    try {
      const collection = await this.getCollection();
      return await collection.find({}).toArray();
    } catch (error) {
      console.error('Error finding all consumers:', error);
      throw error;
    }
  }

  async findByType(type) {
    try {
      const collection = await this.getCollection();
      return await collection.find({ type }).toArray();
    } catch (error) {
      console.error('Error finding consumers by type:', error);
      throw error;
    }
  }

  async getConsumerTypes() {
    try {
      console.log("MPConsumersRepository.getConsumerTypes - Getting distinct types");
      const collection = await this.getCollection();
      const types = await collection.distinct('type');
      console.log("Found consumer types:", types);
      return types;
    } catch (error) {
      console.error('Error getting consumer types:', error);
      throw error;
    }
  }

  async findOne(query) {
    try {
      const collection = await this.getCollection();
      return await collection.findOne(query);
    } catch (error) {
      console.error('Error finding consumer:', error);
      throw error;
    }
  }

  async updateConsumer(query, updateData) {
    try {
      const collection = await this.getCollection();
      return await collection.updateOne(query, { $set: updateData });
    } catch (error) {
      console.error('Error updating consumer:', error);
      throw error;
    }
  }

  async getConsumerNumbers(type = null) {
    try {
      console.log("MPConsumersRepository.getConsumerNumbers - type parameter:", type);
      const collection = await this.getCollection();
      const query = type && type !== 'all' ? { type } : {};
      console.log("Query object:", query);
      const consumers = await collection.find(query, { projection: { phoneNumber: 1, name: 1, type: 1 } }).toArray();
      console.log("Found consumers:", consumers.length);
      if (consumers.length > 0) {
        console.log("Sample consumer:", consumers[0]);
      }
      return consumers.map(consumer => consumer.phoneNumber).filter(phone => phone);
    } catch (error) {
      console.error('Error getting consumer numbers:', error);
      throw error;
    }
  }

  async getConsumerData(type = null) {
    try {
      console.log("MPConsumersRepository.getConsumerData - type parameter:", type);
      const collection = await this.getCollection();
      const query = type && type !== 'all' ? { type } : {};
      console.log("Query object:", query);
      const consumers = await collection.find(query).toArray();
      console.log("Found consumer data:", consumers.length);
      if (consumers.length > 0) {
        console.log("Sample consumer data:", {
          name: consumers[0].name,
          type: consumers[0].type,
          phoneNumber: consumers[0].phoneNumber
        });
      }
      return consumers;
    } catch (error) {
      console.error('Error getting consumer data:', error);
      return [];
    }
  }

  async getConsumerGroups() {
    try {
      const types = await this.getConsumerTypes();
      return types.map(type => ({
        value: type,
        label: type,
        count: 0 // You can add count if needed
      }));
    } catch (error) {
      console.error('Error getting consumer groups:', error);
      return [];
    }
  }

  async findById(id) {
    try {
      const collection = await this.getCollection();
      return await collection.findOne({ _id: id });
    } catch (error) {
      console.error('Error finding consumer by ID:', error);
      throw error;
    }
  }

  async findByPhoneNumber(phoneNumber) {
    try {
      const collection = await this.getCollection();
      return await collection.findOne({ phoneNumber });
    } catch (error) {
      console.error('Error finding consumer by phone number:', error);
      throw error;
    }
  }

  async getConsumersByLocation(location) {
    try {
      const collection = await this.getCollection();
      return await collection.find({ location }).toArray();
    } catch (error) {
      console.error('Error finding consumers by location:', error);
      throw error;
    }
  }

  async getLocations() {
    try {
      const collection = await this.getCollection();
      return await collection.distinct('location');
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  }

  async getConsumerStats() {
    try {
      const collection = await this.getCollection();
      const pipeline = [
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ];
      
      const stats = await collection.aggregate(pipeline).toArray();
      const total = await collection.countDocuments();
      
      return {
        total,
        byType: stats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting consumer stats:', error);
      throw error;
    }
  }
}
