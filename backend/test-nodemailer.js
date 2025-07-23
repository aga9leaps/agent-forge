import nodemailer from "nodemailer";

console.log("Testing nodemailer import and method...");

try {
  // Test the correct method name
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "test@gmail.com",
      pass: "test-password",
    },
  });
  
  console.log("✅ nodemailer.createTransport works correctly");
  console.log("✅ Email transporter created successfully");
  
} catch (error) {
  console.error("❌ Error with nodemailer:", error.message);
}
