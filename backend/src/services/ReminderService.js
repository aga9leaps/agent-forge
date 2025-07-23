import { reminderCategoryRules, reminderPhases } from "../utils/constants.js";
import CustomerInteractionRepository from "../repository/customerInteractionRepository.js";
import RemiderRepository from "../repository/reminderRepository.js";
import {
  calculateStatistics,
  categorizeDealer,
} from "../utils/statisticsHelper.js";
import WhatsAppService from "./WhatsAppService.js";
import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });

export default class ReminderService {
  constructor() {
    this.remiderRepository = new RemiderRepository();
    this.customerInteractionRepository = new CustomerInteractionRepository(
      process.env.CUSTOMER_COLLECTION
    );
    this.reminderRules = [];
    this.intervalsArray = [];
  }

  async processReminders(typeOfData) {
    try {
      // Load reminder rules from database
      this.reminderRules = await this.remiderRepository.getReminderRules();

      // If no rules exist, create default rules
      if (!this.reminderRules || this.reminderRules.length === 0) {
        await this.setupReminderRules();
        this.reminderRules = await this.remiderRepository.getReminderRules();
      }

      const rawData = await this.remiderRepository.getRawData(typeOfData);
      if (!rawData.success) {
        return {
          success: rawData.success,
          message: rawData.message,
        };
      }

      this.intervalsArray = this.calculateIntervals(rawData.data);
      const analysisResults = await this.analyzeAllDealers();

      await this.saveAnalysisToDatabase(typeOfData, analysisResults);
      const reminderResults = await this.processPersonalizedReminders(
        typeOfData,
        analysisResults
      );

      return {
        success: true,
        message: `Successfully analyzed ${analysisResults.length} dealers and scheduled ${reminderResults.scheduledCount} reminders`,
        dealers: analysisResults.map((a) => a.customerName),
      };
    } catch (error) {
      console.error("Error in analytics engine:", error);
      return {
        success: false,
        message: `Error: ${error.message}`,
        error,
      };
    }
  }

  calculateIntervals(data) {
    const particularsMap = {};

    data.forEach(({ Particulars, Date_Of_Action }) => {
      if (!particularsMap[Particulars]) particularsMap[Particulars] = [];
      particularsMap[Particulars].push(new Date(Date_Of_Action).getTime());
    });

    for (const particulars in particularsMap) {
      const dates = particularsMap[particulars].sort((a, b) => a - b);

      // Compute order intervals (days between orders)
      const intervals = dates
        .slice(1)
        .map((date, i) => (date - dates[i]) / (1000 * 60 * 60 * 24));

      if (intervals.length === 0) continue;

      this.intervalsArray.push({
        Particulars: particulars,
        Intervals: intervals,
        Last_action_date: new Date(dates[dates.length - 1]),
      });
    }

    // fs.writeFileSync(
    //   `./intervals_${typeOfData}.json`,
    //   JSON.stringify(this.intervalsArray, null, 2)
    // );
    return this.intervalsArray;
  }

  async analyzeAllDealers() {
    const analysisResults = [];

    if (this.intervalsArray.length === 0) return analysisResults;

    for (const dealer of this.intervalsArray) {
      const customerName = dealer["Particulars"];
      const intervals = dealer["Intervals"];

      if (!intervals || intervals.length === 0) continue;

      // Perform statistical analysis
      const analysis = calculateStatistics(customerName, intervals);

      // Categorize dealer based on metrics
      const { basicCategory, refinedCategory } = categorizeDealer(
        analysis,
        this.intervalsArray
      );

      // Add categories to analysis results
      analysis.basicCategory = basicCategory;
      analysis.refinedCategory = refinedCategory;
      analysis.lastActionDate = dealer["Last_action_date"];

      analysisResults.push(analysis);
    }

    // Sort dealers for quartile-based refinement
    this.refineCategories(analysisResults);

    return analysisResults;
  }

  refineCategories(analysisResults) {
    // Sort by mean interval for frequency quartiles
    const sortedByMean = [...analysisResults].sort(
      (a, b) => a.meanInterval - b.meanInterval
    );

    // Calculate quartile size
    const count = sortedByMean.length;
    const quartileSize = Math.max(1, Math.floor(count / 4));

    // Define quartile labels
    const frequencyLabels = [
      "Very High Frequency",
      "High Frequency",
      "Medium Frequency",
      "Low Frequency",
    ];

    // Sort by coefficient of variation for regularity quartiles
    const sortedByCV = [...analysisResults].sort(
      (a, b) => a.coefficientVariation - b.coefficientVariation
    );

    const regularityLabels = [
      "Very Regular",
      "Regular",
      "Somewhat Irregular",
      "Very Irregular",
    ];

    // Assign refined categories
    for (const analysis of analysisResults) {
      const meanRank = sortedByMean.findIndex(
        (a) => a.customerName === analysis.customerName
      );
      const cvRank = sortedByCV.findIndex(
        (a) => a.customerName === analysis.customerName
      );

      const freqQuartile = Math.min(3, Math.floor(meanRank / quartileSize));
      const regQuartile = Math.min(3, Math.floor(cvRank / quartileSize));

      analysis.refinedCategory = `${frequencyLabels[freqQuartile]} - ${regularityLabels[regQuartile]}`;
    }
  }

  async saveAnalysisToDatabase(typeOfData, analysisResults) {
    await this.remiderRepository.saveAnalysisResults(
      typeOfData,
      analysisResults
    );
  }

  async setupReminderRules() {
    const rules = [];
    for (const categoryRule of reminderCategoryRules) {
      for (const phase of categoryRule.phases) {
        const phaseInfo = reminderPhases[phase];

        rules.push({
          category_type: categoryRule.type,
          category: categoryRule.category,
          reminder_phase: phase,
          interval_multiplier: phaseInfo.multiplier,
          timing_precision: categoryRule.precision,
          communication_channel: phaseInfo.channel,
          dealer_order_message_template: phaseInfo.dealer_order_message,
          dealer_payment_message_template: phaseInfo.dealer_payment_message,
          sales_team_action_for_order: phaseInfo.sales_order_action,
          sales_team_action_for_payments: phaseInfo.sales_payment_action,
          active: true,
        });
      }
    }

    await this.remiderRepository.saveReminderRules(rules);
  }

  async processPersonalizedReminders(typeOfData, analysisResults) {
    const scheduledReminders = [];
    const maxReminderAttempts = 5;
    const maxDaysSinceAction = 90;

    for (const dealer of analysisResults) {
      try {
        // Skip dealers who have exceeded max attempts or inactive time
        const attempts = dealer.reminder_attempts || 0;

        // TODO: Changed the date to 1st Sept 2024 for testing
        const timeSinceLastAction =
          (Date("2024-09-01T00:00:00") - dealer.lastActionDate.getTime()) /
          (1000 * 60 * 60 * 24);

        if (
          attempts >= maxReminderAttempts ||
          timeSinceLastAction > maxDaysSinceAction
        ) {
          console.log("All limits exceeded");
          continue;
        }

        // Find applicable rules for this dealer
        const categoryType = "Refined"; // Prefer refined categories
        const dealerCategory = dealer.refinedCategory;

        // Find applicable rules for this dealer
        let applicableRules = this.reminderRules.filter(
          (rule) =>
            rule.category_type === categoryType &&
            rule.category === dealerCategory &&
            rule.active
        );

        // If no refined category rules found, fall back to basic category
        if (applicableRules.length === 0) {
          applicableRules = this.reminderRules.filter(
            (rule) =>
              rule.category_type === "Basic" &&
              rule.category === dealer.basicCategory &&
              rule.active
          );

          // If still no rules, skip this dealer
          if (applicableRules.length === 0) continue;
        }

        // Use long mean interval if available, otherwise use regular mean
        const baseInterval =
          dealer.longIntervalMean > 0
            ? dealer.longIntervalMean
            : dealer.meanInterval;

        // Skip if interval is zero
        if (baseInterval <= 0) continue;

        // Calculate expected next action (order or payment) date
        const lastActionDate = new Date(dealer.lastActionDate);
        const expectedNextActionDate = new Date(lastActionDate);
        expectedNextActionDate.setDate(
          lastActionDate.getDate() + Math.round(baseInterval)
        );

        // Check if there are any existing reminders
        const existingReminders =
          await this.remiderRepository.getDealerReminders(dealer.customerName);

        if (!existingReminders || existingReminders.length === 0) {
          console.log("No existing reminders for: ", dealer.customerName);
        }

        const pendingReminders = existingReminders.filter(
          (r) => r.status === "Pending"
        );

        // If no pending reminders, schedule new ones
        if (pendingReminders.length === 0) {
          console.log("Creating new reminder for: ", dealer.customerName);

          // For each applicable rule, create a reminder
          for (const rule of applicableRules) {
            // Calculate reminder date based on rule's interval multiplier
            const reminderDate = new Date(lastActionDate);
            const daysToAdd = Math.round(
              baseInterval * rule.interval_multiplier
            );
            reminderDate.setDate(lastActionDate.getDate() + daysToAdd);

            // Skip if reminder date is in the past
            // TODO: Changed the date to 1st Sept 2024 for testing
            if (reminderDate < new Date("2024-09-01T00:00:00")) {
              console.log(
                "Skip if reminder date is in the past: ",
                dealer.customerName
              );
              continue;
            }

            // Create a new reminder
            const newReminder = {
              customer_name: dealer.customerName,
              rule_id: rule.rule_id,
              expected_action_date: expectedNextActionDate,
              reminder_date: reminderDate,
              reminder_type: typeOfData,
              status: "Pending",
              effectiveness: "Unknown",
              notes: `Scheduled based on ${categoryType} category: ${dealer.refinedCategory}`,
            };

            await this.remiderRepository.saveReminder(newReminder);
            scheduledReminders.push(newReminder);
          }
        }
      } catch (error) {
        console.error(
          `Error processing reminders for ${dealer.customerName}:`,
          error
        );
      }
    }

    return {
      success: true,
      scheduledCount: scheduledReminders.length,
      message: `Scheduled ${scheduledReminders.length} reminders`,
    };
  }

  async sendReminders(typeOfReminder) {
    // TODO: For testing
    // Check for reminders that need to be sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      this.reminderRules = await this.remiderRepository.getReminderRules();

      if (!this.reminderRules || this.reminderRules.length === 0) {
        return {
          success: false,
          message: "Reminder Rules not set.",
        };
      }

      const analysedData = await this.remiderRepository.getAnalysedData(
        typeOfReminder
      );
      if (!analysedData.success) {
        return {
          success: analysedData.success,
          message: analysedData.message,
        };
      }

      const lastActionKey =
        typeOfReminder === "order" ? "last_order_date" : "last_payment_date";

      for (const dealer of analysedData.data) {
        // Get customer contact details
        const customerDetails =
          await this.customerInteractionRepository.getCustomerDetailsFromParticulars(
            dealer.customer_name
          );

          console.log("Customer Details: ", customerDetails, "   ", dealer.customer_name);
        if (!customerDetails) {
          // console.log("No cutsomer details found for: ", dealer.customer_name);
          continue;
        }

        const dueTodayReminders = await this.remiderRepository.getDueReminders(
          dealer.customer_name,
          today,
          tomorrow
        );

        // Process due reminders
        for (const reminder of dueTodayReminders) {
          const rule = this.reminderRules.find(
            (r) => r.rule_id === reminder.rule_id
          );
          if (!rule) continue;

          const messageTemplate =
            typeOfReminder === "order"
              ? "dealer_order_message_template"
              : "dealer_payment_message_template";
          // Format the message with dealer-specific information
          const formattedMessage = this.formatReminderMessage(
            rule[messageTemplate],
            dealer,
            customerDetails,
            lastActionKey
          );

          let phoneNumber = customerDetails.Primary_Mobile_Number.replace(
            /\D/g,
            ""
          );
          // Send the reminder based on the communication channel
          const response = await this.sendReminderByChannel(
            rule.communication_channel,
            phoneNumber,
            formattedMessage,
            dealer
          );

          // Update reminder status
          if (response?.success) {
            const whatsapp_message_id = response.response?.messages[0].id;

            await this.remiderRepository.updateReminderStatus(
              reminder.reminder_id,
              whatsapp_message_id,
              "Sent",
              `Sent via ${
                rule.communication_channel
              } on ${new Date().toISOString()}`
            );

            // Update the dealer reminder attempts
            dealer.reminder_attempts = (dealer.reminder_attempts || 0) + 1;
            dealer.last_reminder_sent = new Date();

            await this.remiderRepository.updateDealerReminderAttempts(
              dealer.customer_name,
              dealer.reminder_attempts,
              dealer.last_reminder_sent
            );
          }
        }
      }

      return {
        success: true,
        message: "Remindeer Sent",
      };
    } catch (error) {
      console.error(`Error processing reminders:`, error?.message || error);
      return {
        success: false,
        message: error?.message || "Something went wrong",
      };
    }
  }

  formatReminderMessage(template, dealer, customerDetails, lastActionKey) {
    return template
      .replace("{customer_name}", customerDetails.name || dealer.customerName)
      .replace("{last_order_date}", dealer[lastActionKey].toLocaleDateString())
      .replace(
        "{last_payment_date}",
        dealer[lastActionKey].toLocaleDateString()
      )
      .replace(
        "{expected_order_date}",
        new Date(
          dealer[lastActionKey].getTime() +
            dealer.meanInterval * 24 * 60 * 60 * 1000
        ).toLocaleDateString()
      )
      .replace("{category}", dealer.refinedCategory);
  }

  async sendReminderByChannel(channel, phoneNumber, message, dealer) {
    try {
      // if (channel.includes("Email") && customerDetails.email) {
      //   await sendEmail(
      //     customerDetails.email,
      //     `Order Reminder from Your Supplier`,
      //     message
      //   );
      // }

      if (channel.includes("SMS") || channel.includes("WhatsApp")) {
        console.log("Sending WhatsApp message fro: ", dealer.customer_name);

        if (phoneNumber) {
          return await WhatsAppService.sendMessageToWhatsApp(
            phoneNumber,
            message
          );
        }
      }

      // if (channel.includes("Call")) {
      //   await this.customerInteractionRepository.logCallReminder(
      //     dealer.customerName,
      //     message,
      //     customerDetails.phoneNumber
      //   );
      // }
      return {
        success: false,
      };
    } catch (error) {
      console.error("Error sending reminder:", error);
      return false;
    }
  }
}
