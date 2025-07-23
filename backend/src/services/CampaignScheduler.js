import cron from "node-cron";
import CampaignManagerService from "../services/CampaignManagerService.js";
import dotenv from "dotenv";

dotenv.config({ path: "./configs/.env" });

export default class CampaignScheduler {
  constructor() {
    this.campaignManagerService = new CampaignManagerService();
  }

  initialize() {
    console.log("Initializing Campaign Scheduler...");
    
    // Schedule birthday messages to run daily at 9:00 AM IST
    cron.schedule('0 9 * * *', async () => {
      console.log("Running daily birthday message job...");
      try {
        await this.campaignManagerService.sendBirthdayMessages();
        console.log("Birthday messages job completed successfully");
      } catch (error) {
        console.error("Error in birthday messages job:", error);
      }
    }, {
      timezone: "Asia/Kolkata"
    });

    console.log("Campaign Scheduler initialized successfully");
  }
}
