import axios from "axios";
import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });
import https from "https";
// import fs from "fs";
// import path from "path";

export const axiosInstance = axios.create({
  baseURL: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_ACCOUNT_ID}`,
  timeout: 30000,
  headers: {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    "Content-Type": "application/json",
  },
  httpsAgent: new https.Agent({ keepAlive: true }),
});

// export const refreshWhatsAppToken = async () => {
//   try {
//     const response = await axios.get(
//       `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/oauth/access_token`,
//       {
//         params: {
//           grant_type: "fb_exchange_token",
//           client_id: process.env.WHATSAPP_APP_ID,
//           client_secret: process.env.APP_SECRET,
//           set_token_expires_in_60_days: true,
//           fb_exchange_token: process.env.WHATSAPP_TOKEN_2,
//         },
//       }
//     );

//     const newAccessToken = response?.data?.access_token;

//     if (newAccessToken) {
//       const envPath = path.resolve(__dirname, "../.env");
//       console.log("🚀 ~ refreshWhatsAppToken ~ envPath:", envPath);
//       let envContent = fs.readFileSync(envPath, "utf-8");

//       // Update the token by replacing the existing line
//       envContent = envContent.replace(
//         /WHATSAPP_TOKEN_2=.*/,
//         `WHATSAPP_TOKEN_2=${newAccessToken}`
//       );

//       fs.writeFileSync(envPath, envContent, "utf-8");

//       console.log("WhatsApp token updated successfully in .env file.");
//     }

//     return {
//       success: true,
//       message: "Access token updated successufully",
//     };
//   } catch (error) {
//     console.error("Failed to refresh WhatsApp token:", error?.message || error);
//   }
// };
