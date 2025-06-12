import { GoogleSpreadsheet } from "google-spreadsheet";
import dotenv from "dotenv";
import { JWT } from "google-auth-library";
import credentials from "../../configs/sheet-servoce-account-data.json" with { type : "json" };
import ConsumerRepository from '../repository/consumerRepository.js';


dotenv.config({ path: "../.env" });

export default class GoogleSheetService {
  constructor() {
    this.consumerRepository = new ConsumerRepository(process.env.CONSUMER_COLLECTION);
    this.initialized = false;
    this.doc = null;
  }

  async init() {
    try {
      const client = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      await client.authorize();
      this.doc = new GoogleSpreadsheet(
        process.env.GOOGLE_SHEET_ID,
        client
      );

      await this.doc.loadInfo();
      console.log(this.doc?.title);
      this.initialized = true;
      console.log("Google Sheet Service initialized successfully");

      return this.initialized;
    } catch (error) {
      console.error("Error accessing spreadsheet:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      } else if (error.request) {
        console.error("Request:", error.request);
      } else {
        console.error("Error message:", error.message);
      }
    }
  }

  async syncDealersToDB() {
    try {
      if (!this.initialized) {
        throw new Error("Google Sheet Service not initialized");
      }

      const sheet = this.doc.sheetsByIndex[0];
      const rows = await sheet.getRows();

      for (const row of rows) {
        const phoneNumber = row.get("Phone Number");
        const name = row.get("Name");
        const type = row.get("Type");
        const location = row.get("Location");

        if (!phoneNumber || !name || !type || !location) {
          console.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
          continue;
        }

        const existingDealer = await this.consumerRepository.getConsumerByPhoneNumber(
          `91${phoneNumber}`
        );

        if (existingDealer) {
          console.log("Dealer already exist with MongoDB");
          continue;
        }

        const dealerData = {
          name,
          type,
          location,
          phoneNumber: `91${phoneNumber}`,
        };

        await this.consumerRepository.createConsumer(dealerData);
      }
      console.log("Dealer data synchronized with MongoDB");
    } catch (error) {
      console.error("Error syncing dealer data:", error);
      throw error;
    }
  }
}
