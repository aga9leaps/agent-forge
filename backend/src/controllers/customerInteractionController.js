import CustomerInteractionService from "../services/CustomerInteractionService.js";
import ReminderService from "../services/ReminderService.js";

export default class CustomerInteractionController {
  constructor() {}

  initController() {
    this.customerInteractionService = new CustomerInteractionService();
    this.reminderService = new ReminderService();
  }

  async sendBirthdayMessage(req, res) {
    try {
      const response =
        await this.customerInteractionService.sendBirthdayMessage();

      return res.status(200).json({ response });
    } catch (error) {
      console.error("Error in sendBirthdayMessage:", error);
      return res.status(500).json({ error: "Failed to process the request" });
    }
  }

  async processReminders(req, res) {
    try {
      const { typeOfData } = req?.body;
      const response = await this.reminderService.processReminders(typeOfData);

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error in processReminders:", error);
      return res.status(500).json({ error: "Failed to process the request" });
    }
  }

  async sendReminders(req, res) {
    try {
      const { typeOfData } = req?.body;
      const reminder = await this.reminderService.sendReminders(typeOfData);

      return res.status(200).json(reminder);
    } catch (error) {
      console.error("Error in processReminders:", error);
      return res.status(500).json({ error: "Failed to process the request" });
    }
  }
}
