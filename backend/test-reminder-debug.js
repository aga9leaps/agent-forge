import dotenv from "dotenv";
import ReminderService from "./src/services/ReminderService.js";
import ReminderRepository from "./src/repository/reminderRepository.js";

// Load environment variables
dotenv.config({ path: "./configs/.env" });

class ReminderDebugger {
  constructor() {
    this.reminderService = new ReminderService();
    this.reminderRepository = new ReminderRepository();
  }

  async debugReminderIssue() {
    console.log("🔍 Starting Reminder System Debug for customer 'kalyani'...\n");

    try {
      // Step 1: Check analysis data
      console.log("1. Checking analysis data for order and payment reminders...");
      
      const orderAnalysis = await this.reminderRepository.getAnalysedData("order");
      const paymentAnalysis = await this.reminderRepository.getAnalysedData("payment");

      console.log(`📊 Order Analysis Data: ${orderAnalysis.data ? orderAnalysis.data.length : 0} records`);
      console.log(`📊 Payment Analysis Data: ${paymentAnalysis.data ? paymentAnalysis.data.length : 0} records`);

      // Find kalyani in analysis data
      const kalyaniOrderData = orderAnalysis.data?.find(d => 
        d.customer_name?.toLowerCase().includes('kalyani') || 
        d.customerName?.toLowerCase().includes('kalyani')
      );
      
      const kalyaniPaymentData = paymentAnalysis.data?.find(d => 
        d.customer_name?.toLowerCase().includes('kalyani') || 
        d.customerName?.toLowerCase().includes('kalyani')
      );

      console.log("\n🔍 Kalyani in Order Analysis:", kalyaniOrderData ? "FOUND" : "NOT FOUND");
      if (kalyaniOrderData) {
        console.log("   Order Data:", JSON.stringify(kalyaniOrderData, null, 2));
      }

      console.log("\n🔍 Kalyani in Payment Analysis:", kalyaniPaymentData ? "FOUND" : "NOT FOUND");
      if (kalyaniPaymentData) {
        console.log("   Payment Data:", JSON.stringify(kalyaniPaymentData, null, 2));
      }

      // Step 2: Check existing reminders for kalyani
      console.log("\n2. Checking existing reminders for kalyani...");
      
      const existingReminders = await this.reminderRepository.getDealerReminders("kalyani");
      console.log(`📝 Existing reminders for kalyani: ${existingReminders.length}`);
      
      if (existingReminders.length > 0) {
        existingReminders.forEach((reminder, index) => {
          console.log(`   Reminder ${index + 1}:`, {
            id: reminder.reminder_id,
            type: reminder.reminder_type,
            date: reminder.reminder_date,
            status: reminder.status,
            expected_action_date: reminder.expected_action_date
          });
        });
      }

      // Step 3: Check due reminders for today
      console.log("\n3. Checking due reminders for today...");
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log(`📅 Today: ${today.toISOString()}`);
      console.log(`📅 Tomorrow: ${tomorrow.toISOString()}`);

      const dueReminders = await this.reminderRepository.getDueReminders("kalyani", today, tomorrow);
      console.log(`⏰ Due reminders for kalyani today: ${dueReminders.length}`);
      
      if (dueReminders.length > 0) {
        dueReminders.forEach((reminder, index) => {
          console.log(`   Due Reminder ${index + 1}:`, {
            id: reminder.reminder_id,
            type: reminder.reminder_type,
            date: reminder.reminder_date,
            status: reminder.status
          });
        });
      }

      // Step 4: Check reminder rules
      console.log("\n4. Checking reminder rules...");
      
      const reminderRules = await this.reminderRepository.getReminderRules();
      console.log(`📋 Total reminder rules: ${reminderRules.length}`);
      
      const activeRules = reminderRules.filter(rule => rule.active);
      console.log(`✅ Active reminder rules: ${activeRules.length}`);

      // Step 5: Check customer details in MongoDB
      console.log("\n5. Checking customer details in MongoDB...");
      
      try {
        const customerDetails = await this.reminderService.customerInteractionRepository.getCustomerDetailsFromParticulars("kalyani");
        console.log("👤 Customer details for kalyani:", customerDetails ? "FOUND" : "NOT FOUND");
        
        if (customerDetails) {
          console.log("   Customer info:", {
            name: customerDetails.name,
            mobile: customerDetails.Primary_Mobile_Number,
            // Don't log full details for privacy
          });
        }
      } catch (error) {
        console.error("❌ Error checking customer details:", error.message);
      }

      // Step 6: Simulate sending reminders
      console.log("\n6. Simulating reminder sending process...");
      
      try {
        const result = await this.reminderService.sendReminders("order");
        console.log("📤 Order reminders result:", result);
      } catch (error) {
        console.error("❌ Error sending order reminders:", error.message);
      }

      try {
        const result = await this.reminderService.sendReminders("payment");
        console.log("📤 Payment reminders result:", result);
      } catch (error) {
        console.error("❌ Error sending payment reminders:", error.message);
      }

    } catch (error) {
      console.error("❌ Debug error:", error);
    }
  }

  async createTestReminder() {
    console.log("\n🛠️  Creating test reminder for kalyani...");
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const testReminder = {
        customer_name: "kalyani",
        rule_id: 1, // Assuming rule ID 1 exists
        expected_action_date: new Date(),
        reminder_date: today,
        reminder_type: "order",
        status: "Pending",
        effectiveness: "Unknown",
        notes: "Test reminder created for debugging"
      };

      await this.reminderRepository.saveReminder(testReminder);
      console.log("✅ Test reminder created successfully");
      
      // Now try to get due reminders again
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dueReminders = await this.reminderRepository.getDueReminders("kalyani", today, tomorrow);
      console.log(`⏰ Due reminders after creating test: ${dueReminders.length}`);
      
    } catch (error) {
      console.error("❌ Error creating test reminder:", error);
    }
  }
}

// Run the debugger
async function main() {
  const reminderDebugger = new ReminderDebugger();
  
  await reminderDebugger.debugReminderIssue();
  
  // Uncomment the line below if you want to create a test reminder
  // await reminderDebugger.createTestReminder();
}

main().catch(console.error);
