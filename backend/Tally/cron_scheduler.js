import cron from "node-cron";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { downloadFileFromS3 } from "./s3Utils.js"; // Import S3 utility functions

// Correctly resolve the directory path
const __dirname = path
  .dirname(new URL(import.meta.url).pathname)
  .replace(/^\/([a-zA-Z]:)/, "$1"); // Fix for Windows paths
const localScriptsDir = path.resolve(__dirname, "TallyReports");
const localConfigPath = path.resolve(__dirname, "cron-config.json");
const configS3Key = "Tally/cron-config.json"; // S3 key for the configuration file

// Ensure local directories exist
function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    console.error(`Error creating directory: ${err.message}`);
  }
}

ensureDir(localScriptsDir);

// Function to load and parse the configuration file
async function loadConfig() {
  console.log("Fetching configuration file from S3...");
  await downloadFileFromS3(configS3Key, localConfigPath);

  const configContent = fs.readFileSync(localConfigPath, "utf-8");
  return JSON.parse(configContent);
}

// Function to schedule tasks dynamically
async function scheduleTasks() {
  const config = await loadConfig();

  config.scripts.forEach((script) => {
    const { name, s3Key, schedule, csvKey } = script;

    cron.schedule(schedule, async () => {
      console.log(`Fetching ${name}.js from S3...`);
      const localScriptPath = path.join(localScriptsDir, `${name}.js`);

      // Download the script from S3
      await downloadFileFromS3(s3Key, localScriptPath);

      // Execute the script to generate the CSV
      console.log(`Running ${name}.js...`);
      exec(`node ${localScriptPath}`, async (error, stdout, stderr) => {
        if (error) console.error(`Error: ${error.message}`);
        if (stderr) console.error(`Stderr: ${stderr}`);
        console.log(`${name} report completed: ${stdout}`);
      });
    });

    console.log(`Scheduled ${name}.js with schedule: ${schedule}`);
  });
}

// Start the scheduler
scheduleTasks().then(() => {
  console.log("Scheduler started. Reports will run at scheduled intervals.");
});
