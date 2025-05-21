import path from "path";
import BaseSqlRepository from "../../core/baseRepository/baseSqlRepository.js";

export default class RemiderRepository extends BaseSqlRepository {
  async getRawData(typeOfData) {
    try {
      let tableName = "vouchers";
      let voucherType;
      if (typeOfData === "order") voucherType = "GST Sales";
      else if (typeOfData === "payment") voucherType = "Receipt";
      else
        return {
          success: false,
          message: "Enter vaild data type",
        };
      const query = `SELECT Particulars, Date_Of_Action FROM ${tableName} WHERE Voucher_Type = ? ORDER BY Particulars, Date_Of_Action ASC`;
      const data = await this.executeQuery(query, [voucherType]);
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error getting raw data: ", error?.message || error);
      return {
        success: false,
        message: "Something went wrong",
      };
    }
  }

  async getAnalysedData(typeOfReminder) {
    try {
      let tableName;
      if (typeOfReminder === "order") tableName = "dealer_ordering_analysis";
      else if (typeOfReminder === "payment")
        tableName = "dealer_payment_analysis";
      else
        return {
          success: false,
          message: "Enter vaild data type",
        };
      const query = `SELECT * FROM ${tableName}`;
      const data = await this.executeQuery(query, []);
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error getting raw data: ", error?.message || error);
      return {
        success: false,
        message: "Something went wrong",
      };
    }
  }

  async saveReminderRules(rules) {
    const tableExist = await this.checkIfTableAlreadyExists("reminder_rules");

    if (!tableExist) {
      const sqlFilePath = path.join(
        process.cwd(),
        "src",
        "tables",
        `reminder_rules.sql`
      );
      console.log(
        "🚀 ~ RemiderRepository ~ saveReminderRules ~ sqlFilePath:",
        sqlFilePath
      );
      await this.createTable(sqlFilePath);
    }

    try {
      const insertQuery = `
        INSERT INTO reminder_rules (
          category_type, category, reminder_phase, interval_multiplier,
          timing_precision, communication_channel, dealer_order_message_template, dealer_payment_message_template,
          sales_team_action_for_order, sales_team_action_for_payments, active
        ) VALUES ${rules
          .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .join(", ")}
      `;
      const values = rules.flatMap((rule) => [
        rule.category_type,
        rule.category,
        rule.reminder_phase,
        rule.interval_multiplier,
        rule.timing_precision,
        rule.communication_channel,
        rule.dealer_order_message_template,
        rule.dealer_payment_message_template,
        rule.sales_team_action_for_order,
        rule.sales_team_action_for_payments,
        rule.active,
      ]);
      await this.executeQuery(insertQuery, values);
      console.log(`Inserted ${rules.length} default reminder rules`);
      return true;
    } catch (error) {
      console.error(
        "Error saving reminder rules to database:",
        error?.message || error
      );
      return;
    }
  }

  async saveReminder(reminder) {
    const tableExist = await this.checkIfTableAlreadyExists("dealer_reminders");

    if (!tableExist) {
      const sqlFilePath = path.join(
        process.cwd(),
        "src",
        "tables",
        `dealer_reminders.sql`
      );
      await this.createTable(sqlFilePath);
    }
    try {
      const insertQuery = `
        INSERT INTO dealer_reminders (
          customer_name, rule_id, expected_action_date, reminder_date, reminder_type, status,
          effectiveness, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      const params = [
        reminder.customer_name,
        reminder.rule_id,
        reminder.expected_action_date,
        reminder.reminder_date,
        reminder.reminder_type,
        reminder.status,
        reminder.effectiveness,
        reminder.notes,
      ];

      await this.executeQuery(insertQuery, params);
      return true;
    } catch (error) {
      console.error("Error saving reminder to database:", error);
      return;
    }
  }

  async getReminderRules() {
    try {
      const query = "SELECT * FROM reminder_rules WHERE active = true";
      const rules = await this.executeQuery(query);
      return rules;
    } catch (error) {
      console.error("Error fetching reminder rules:", error);
      return [];
    }
  }

  async saveAnalysisResults(typeOfData, analysisResults) {
    const tableName =
      typeOfData === "order"
        ? "dealer_ordering_analysis"
        : "dealer_payment_analysis";

    const tableExist = await this.checkIfTableAlreadyExists(tableName);

    if (!tableExist) {
      const sqlFilePath = path.join(
        process.cwd(),
        "src",
        "tables",
        `${tableName}.sql`
      );
      await this.createTable(sqlFilePath);
    }
    try {
      const lastActionKey =
        typeOfData === "order" ? "last_order_date" : "last_payment_date";
      for (const analysis of analysisResults) {
        const dbRow = {
          customer_name: analysis.customerName || null,
          mean_interval: analysis.meanInterval ?? null,
          median_interval: analysis.medianInterval ?? null,
          mode_interval: analysis.modeInterval ?? null,
          standard_deviation: analysis.standardDeviation ?? null,
          coefficient_variation: analysis.coefficientVariation ?? null,
          count: analysis.count ?? null,
          total_days_covered: analysis.totalDays ?? null,
          [lastActionKey]: analysis.lastActionDate || null,
          q1_interval: analysis.q1 ?? null,
          q3_interval: analysis.q3 ?? null,
          iqr: analysis.iqr ?? null,
          short_interval_count: analysis.shortIntervalCount ?? null,
          short_interval_percentage: analysis.shortIntervalPercentage ?? null,
          long_interval_count: analysis.longIntervalCount ?? null,
          long_interval_mean: analysis.longIntervalMean ?? null,
          long_interval_stddev: analysis.longIntervalStdDev ?? null,
          max_similar_interval_run: analysis.maxSimilarIntervalRun ?? null,
          avg_run_length: analysis.avgRunLength ?? null,
          regularity_score: analysis.regularityScore ?? null,
          prediction_reliability: analysis.predictionReliability ?? null,
          basic_category: analysis.basicCategory || null,
          refined_category: analysis.refinedCategory || null,
          last_updated: new Date(),
        };

        const columns = Object.keys(dbRow).join(", ");
        const placeholders = Object.keys(dbRow)
          .map(() => "?")
          .join(", ");
        const updateClause = Object.keys(dbRow)
          .filter((key) => key !== "customer_name")
          .map((key) => `${key} = VALUES(${key})`)
          .join(", ");

        const query = `
              INSERT INTO ${tableName} (${columns})
              VALUES (${placeholders})
              ON DUPLICATE KEY UPDATE ${updateClause}
            `;

        await this.executeQuery(query, Object.values(dbRow));
      }
    } catch (error) {
      console.error("Error saving analysis to database:", error);
      return;
    }
  }

  async getDealerReminders(customerName) {
    try {
      const query = `
        SELECT * FROM dealer_reminders
        WHERE customer_name = ?
        ORDER BY reminder_date ASC
      `;
      const reminders = await this.executeQuery(query, [customerName]);
      return reminders;
    } catch (error) {
      console.error("Error fetching dealer reminders:", error);
      return [];
    }
  }

  async getDueReminders(customerName, startDate, endDate) {
    try {
      const query = `
        SELECT * FROM dealer_reminders
        WHERE customer_name = ? AND status = 'Pending'
        AND reminder_date BETWEEN ? AND ?
        ORDER BY reminder_date ASC
      `;
      const reminders = await this.executeQuery(query, [
        customerName,
        startDate,
        endDate,
      ]);
      return reminders;
    } catch (error) {
      console.error("Error fetching due reminders:", error);
      return [];
    }
  }

  async updateReminderStatus(reminderId, whatsapp_message_id, status, notes) {
    try {
      const query = `
        UPDATE dealer_reminders
        SET status = ?, notes = ?, whatsapp_message_id = ?, updated_at = NOW()
        WHERE reminder_id = ?
      `;
      await this.executeQuery(query, [
        status,
        notes,
        whatsapp_message_id,
        reminderId,
      ]);
      return true;
    } catch (error) {
      console.error("Error updating reminder status:", error);
      return false;
    }
  }

  async updateDealerReminderAttempts(customerName, attempts, lastSent) {
    try {
      const query = `
        UPDATE dealer_ordering_analysis
        SET reminder_attempts = ?, last_reminder_sent = ?
        WHERE customer_name = ?
      `;
      await this.executeQuery(query, [attempts, lastSent, customerName]);
      return true;
    } catch (error) {
      console.error("Error updating dealer reminder attempts:", error);
      return false;
    }
  }
}
