import BaseMongoRepository from "./baseRepository/baseMongoRepository.js";

export default class MPCustomersRepository extends BaseMongoRepository {
  constructor(collectionName) {
    super(collectionName);
  }

  async getAllCustomers() {
    try {
      return await this.find({});
    } catch (error) {
      console.error("Error fetching all customers:", error);
      return [];
    }
  }

  async getCustomersByPhoneNumbers(phoneNumbers) {
    try {
      return await this.find({
        Primary_Mobile_Number: { $in: phoneNumbers }
      });
    } catch (error) {
      console.error("Error fetching customers by phone numbers:", error);
      return [];
    }
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

      return await this.find({ 
        Date_Of_Birth: { $regex: regexPattern },
        Primary_Mobile_Number: { $exists: true, $ne: null, $ne: "" },
        whatsappOptOut: { $ne: true }
      });
    } catch (error) {
      console.error("Error fetching customer birthdays:", error);
      return [];
    }
  }

  async getCustomersByDateRange(startDate, endDate) {
    try {
      return await this.find({
        Date_Of_Birth: {
          $gte: startDate,
          $lte: endDate
        }
      });
    } catch (error) {
      console.error("Error fetching customers by date range:", error);
      return [];
    }
  }

  async getCustomerDetailsFromParticulars(particulars) {
    try {
      return await this.findOne({ Particulars: particulars });
    } catch (error) {
      console.log("Error fetching customer details from particulars:", error);
      return null;
    }
  }

  async getCustomerDetailsFromPhoneNumber(phoneNumber) {
    try {
      return await this.findOne({ Primary_Mobile_Number: phoneNumber });
    } catch (error) {
      console.log("Error fetching customer details from phone number:", error);
      return null;
    }
  }

  async getAllCustomerPhoneNumbers() {
    try {
      const customers = await this.find(
        {
          Primary_Mobile_Number: { $exists: true, $ne: null, $ne: "" },
          whatsappOptOut: { $ne: true }
        },
        { Primary_Mobile_Number: 1 }
      );
      return customers.map(customer => customer.Primary_Mobile_Number);
    } catch (error) {
      console.error("Error fetching customer phone numbers:", error);
      return [];
    }
  }

  async getCustomersWithValidPhoneNumbers() {
    try {
      return await this.find({
        Primary_Mobile_Number: { $exists: true, $ne: null, $ne: "" }
      });
    } catch (error) {
      console.error("Error fetching customers with valid phone numbers:", error);
      return [];
    }
  }

  async getCustomerGroups() {
    try {
      console.log("🔍 getCustomerGroups called");
      // Get all unique states from the database
      const collection = await this.getCollection();
      console.log("📊 Collection obtained:", collection.collectionName);
      
      const states = await collection.distinct("State");
      console.log("🌍 States found:", states);
      
      // Filter out null/empty states and sort alphabetically
      const validStates = states.filter(state => state && state.trim() !== "").sort();
      console.log("✅ Valid states:", validStates);
      
      // Create the customer groups array
      const customerGroups = [
        { id: 'all', name: 'All Customers' },
        { id: 'birthday_today', name: 'Birthday Today' }
      ];
      
      // Add each state as a group
      validStates.forEach(state => {
        customerGroups.push({
          id: state,
          name: state
        });
      });
      
      console.log("📋 Customer groups:", customerGroups);
      return customerGroups;
    } catch (error) {
      console.error("Error fetching customer groups:", error);
      return [];
    }
  }

  async getCustomersByState(state) {
    try {
      return await this.find({ 
        State: state,
        Primary_Mobile_Number: { $exists: true, $ne: null, $ne: "" },
        whatsappOptOut: { $ne: true }
      });
    } catch (error) {
      console.error("Error fetching customers by state:", error);
      return [];
    }
  }

  async getAllCustomersWithOptOutFilter() {
    try {
      return await this.find({
        Primary_Mobile_Number: { $exists: true, $ne: null, $ne: "" },
        whatsappOptOut: { $ne: true }
      });
    } catch (error) {
      console.error("Error fetching customers with opt-out filter:", error);
      return [];
    }
  }
}
