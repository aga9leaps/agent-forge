import BaseAgent from "./baseAgent.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

class ReportingAgent extends BaseAgent {
  constructor(db) {
    super(db);
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.reportPath = process.env.REPORT_PATH || "./reports";
  }

  async processTask(task) {
    await this.validateTask(task);

    try {
      // Fetch data
      const data = await this.fetchReportData(task.query.parsedQuery);

      // Generate analysis
      const analysis = await this.analyzeData(task.query.rawQuery, data);

      // Generate PDF report
      const reportPath = await this.generatePDFReport(task.id, analysis, data);

      return {
        success: true,
        result: {
          reportPath,
          analysis,
        },
        format: "pdf",
      };
    } catch (error) {
      console.error("Error in ReportingAgent:", error);
      throw error;
    }
  }

  async fetchReportData(parsedQuery) {
    const { parameters, filters } = parsedQuery;

    // Build complex SQL query based on report requirements
    let query = `
            SELECT 
                s.*,
                DATE_FORMAT(s.date, '%Y-%m') as month,
                SUM(s.amount) as total_amount,
                COUNT(*) as transaction_count
            FROM sales s
            WHERE 1=1
        `;

    const queryParams = [];

    if (filters.startDate) {
      query += " AND s.date >= ?";
      queryParams.push(filters.startDate);
    }

    if (filters.endDate) {
      query += " AND s.date <= ?";
      queryParams.push(filters.endDate);
    }

    query += ' GROUP BY DATE_FORMAT(s.date, "%Y-%m")';

    // Execute query
    const [rows] = await this.db.query(query, queryParams);
    return rows;
  }

  async analyzeData(userQuery, data) {
    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: "system",
          content: `You are a business analyst that provides detailed report analysis. 
                    Create a structured report with sections: Summary, Key Findings, and Recommendations.`,
        },
        {
          role: "user",
          content: `Based on this sales data: ${JSON.stringify(
            data
          )}, generate a detailed analysis for: ${userQuery}`,
        },
      ],
    });

    return response.choices[0].message.content;
  }

  async generatePDFReport(taskId, analysis, data) {
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportPath)) {
      fs.mkdirSync(this.reportPath, { recursive: true });
    }

    const reportFilename = path.join(this.reportPath, `report_${taskId}.pdf`);
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(reportFilename);

    return new Promise((resolve, reject) => {
      doc.pipe(stream);

      // Add report header
      doc.fontSize(20).text("Sales Analysis Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(12);

      // Add timestamp
      doc.text(`Generated on: ${new Date().toLocaleString()}`);
      doc.moveDown();

      // Add analysis
      doc.fontSize(14).text("Analysis");
      doc.fontSize(12).text(analysis);
      doc.moveDown();

      // Add data tables
      doc.fontSize(14).text("Data Overview");
      let yPos = doc.y;
      const tableTop = yPos + 20;

      // Add table headers
      const headers = Object.keys(data[0] || {});
      let xPos = 50;
      headers.forEach((header) => {
        doc.text(header, xPos, tableTop);
        xPos += 100;
      });

      // Add table rows
      yPos = tableTop + 20;
      data.forEach((row) => {
        xPos = 50;
        Object.values(row).forEach((value) => {
          doc.text(String(value), xPos, yPos);
          xPos += 100;
        });
        yPos += 20;
      });

      // Finalize PDF
      doc.end();

      stream.on("finish", () => {
        resolve(reportFilename);
      });

      stream.on("error", reject);
    });
  }
}

export default ReportingAgent;
