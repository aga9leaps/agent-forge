import WhatsAppService from "../../core/WhatsAppService.js";
import CustomerInteractionRepository from "../repository/customerInteractionRepository.js";

export default class CustomerInteractionService {
  constructor() {
    this.customerInteractionRepository = new CustomerInteractionRepository(
      process.env.CONSUMER_COLLECTION
    );
  }

  // Birthday Reminder
  async sendBirthdayMessage() {
    try {
      const customerList =
        await this.customerInteractionRepository.getCustomerBirthdayList();

      console.log(
        "🚀 ~ CustomerInteractionService ~ sendBirthdayMessage ~ customerList:",
        customerList
      );

      for (const customer of customerList) {
        try {
          let phoneNumber = customer.Primary_Mobile_Number.replace(/\D/g, "");
          console.log(`Sending birthday message to: ${phoneNumber}`);

          await WhatsAppService.sendMessageToWhatsApp(
            phoneNumber,
            `Happy Birthday ${customer.Particulars}!`
          );
        } catch (error) {
          console.warn(
            "Error while sending message to: ",
            customer.Particulars
          );
        }
      }

      return {
        success: true,
        message: "Birthday reminders sent.",
      };
    } catch (error) {
      console.error("Error sending birthday message:", error);
      return {
        success: false,
        message: error?.message || "Something went wrong.",
      };
    }
  }
}
