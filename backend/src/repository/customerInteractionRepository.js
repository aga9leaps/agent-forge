import BaseMongoRepository from "./baseRepository/baseMongoRepository.js";

export default class CustomerInteractionRepository extends BaseMongoRepository {
  constructor(collectionName) {
    super(collectionName);
  }

  async getCustomerBirthdayList() {
    try {
      const now = new Date();

      // Get IST Date correctly using UTC functions
      const istDate = new Date(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours() + 5, // Adding 5 hours
        now.getUTCMinutes() + 30 // Adding 30 minutes
      );

      const month = (istDate.getMonth() + 1).toString().padStart(2, "0");
      const day = istDate.getDate().toString().padStart(2, "0");
      const regexPattern = new RegExp(`^\\d{4}-${month}-${day}$`);

      return await this.find({ Date_Of_Birth: { $regex: regexPattern } });
    } catch (error) {
      console.error("Error fetching customer birthdays:", error);
      return [];
    }
  }

  async getCustomerDetailsFromParticulars(particluars) {
    try {
      return await this.findOne({ Particulars: particluars });
    } catch (error) {
      console.log("Error fetching customer details from particulars:", error);
      return null;
    }
  }
}
