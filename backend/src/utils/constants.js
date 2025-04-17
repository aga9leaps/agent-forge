const reminderCategoryRules = [
  // Refined category rules
  {
    type: "Refined",
    category: "Very High Frequency - Very Regular",
    phases: ["Phase 3", "Phase 4"],
    precision: "High (±2 days)",
  },
  {
    type: "Refined",
    category: "High Frequency - Very Regular",
    phases: ["Phase 2", "Phase 3", "Phase 4"],
    precision: "High (±2 days)",
  },
  {
    type: "Refined",
    category: "High Frequency - Regular",
    phases: ["Phase 2", "Phase 3", "Phase 4", "Phase 5"],
    precision: "Medium to High (±3-5 days)",
  },
  {
    type: "Refined",
    category: "High Frequency - Somewhat Irregular",
    phases: ["Phase 2", "Phase 3", "Phase 4", "Phase 5"],
    precision: "Medium (±5 days)",
  },
  {
    type: "Refined",
    category: "High Frequency - Very Irregular",
    phases: ["Phase 1", "Phase 2", "Phase 4", "Phase 5"],
    precision: "Low (±10 days)",
  },

  {
    type: "Refined",
    category: "Very High Frequency - Regular",
    phases: ["Phase 2", "Phase 3", "Phase 4"],
    precision: "High (±2 days)",
  },
  {
    type: "Refined",
    category: "Very High Frequency - Somewhat Irregular",
    phases: ["Phase 2", "Phase 3", "Phase 4", "Phase 5"],
    precision: "Medium (±5 days)",
  },
  {
    type: "Refined",
    category: "Very High Frequency - Very Irregular",
    phases: ["Phase 2", "Phase 3", "Phase 4", "Phase 5"],
    precision: "Low (±10 days)",
  },

  {
    type: "Refined",
    category: "Medium Frequency - Very Regular",
    phases: ["Phase 1", "Phase 3", "Phase 5"],
    precision: "High (±2 days)",
  },
  {
    type: "Refined",
    category: "Medium Frequency - Regular",
    phases: ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5"],
    precision: "Medium (±5 days)",
  },
  {
    type: "Refined",
    category: "Medium Frequency - Somewhat Irregular",
    phases: ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5"],
    precision: "Medium (±5 days)",
  },
  {
    type: "Refined",
    category: "Medium Frequency - Very Irregular",
    phases: ["Phase 1", "Phase 2", "Phase 4", "Phase 5"],
    precision: "Low (±10 days)",
  },

  {
    type: "Refined",
    category: "Low Frequency - Very Regular",
    phases: ["Phase 1", "Phase 3", "Phase 5"],
    precision: "High (±2 days)",
  },
  {
    type: "Refined",
    category: "Low Frequency - Regular",
    phases: ["Phase 1", "Phase 3", "Phase 5"],
    precision: "Medium (±5 days)",
  },
  {
    type: "Refined",
    category: "Low Frequency - Somewhat Irregular",
    phases: ["Phase 1", "Phase 2", "Phase 3", "Phase 5"],
    precision: "Medium to Low (±7 days)",
  },
  {
    type: "Refined",
    category: "Low Frequency - Very Irregular",
    phases: ["Phase 1", "Phase 2", "Phase 4", "Phase 5"],
    precision: "Low (±10 days)",
  },

  // Basic category rules (as fallback)
  {
    type: "Basic",
    category: "High Frequency Regular",
    phases: ["Phase 2", "Phase 3", "Phase 4"],
    precision: "Medium to High (±3-5 days)",
  },
  {
    type: "Basic",
    category: "High Frequency Irregular",
    phases: ["Phase 2", "Phase 3", "Phase 4", "Phase 5"],
    precision: "Medium (±5 days)",
  },
  {
    type: "Basic",
    category: "Medium Frequency Regular",
    phases: ["Phase 1", "Phase 3", "Phase 4", "Phase 5"],
    precision: "Medium (±5 days)",
  },
  {
    type: "Basic",
    category: "Medium Frequency Irregular",
    phases: ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5"],
    precision: "Medium to Low (±7 days)",
  },
  {
    type: "Basic",
    category: "Low Frequency Regular",
    phases: ["Phase 1", "Phase 3", "Phase 5"],
    precision: "Medium (±5 days)",
  },
  {
    type: "Basic",
    category: "Low Frequency Irregular",
    phases: ["Phase 1", "Phase 2", "Phase 4", "Phase 5"],
    precision: "Low (±10 days)",
  },
];

const reminderPhases = {
  "Phase 1": {
    multiplier: 0.55,
    dealer_order_message:
      "Educational content: Best practices for product usage and maintenance.",
    dealer_payment_message:
      "Educational tip: Benefits of timely payment and credit health.",
    sales_order_action:
      "Early relationship touch point. Send educational content, no sales intent.",
    sales_payment_action:
      "Gentle reminder about maintaining healthy payment timelines.",
    channel: "WhatsApp",
  },
  "Phase 2": {
    multiplier: 0.75,
    dealer_order_message:
      "Checking in on how our products are performing for you. Many customers typically consider reordering around this time.",
    dealer_payment_message:
      "Friendly reminder: Your payment will be due soon. Let us know if you have any questions.",
    sales_order_action:
      "Gentle awareness reminder. Begin transitioning to order consideration.",
    sales_payment_action:
      "Build awareness about the upcoming due date without pressure.",
    channel: "WhatsApp",
  },
  "Phase 3": {
    multiplier: 0.9,
    dealer_order_message:
      "Based on your typical ordering pattern, you might be ready to restock soon. Your last order was on {last_order_date}.",
    dealer_payment_message:
      "Just a heads-up: Your payment is approaching the due date. We’re here if you need assistance. Your last payment was on {last_payment_date}",
    sales_order_action:
      "Direct reminder needed. Provide specific past order information.",
    sales_payment_action: "Timely follow-up on approaching payment due date.",
    channel: "WhatsApp + SMS",
  },
  "Phase 4": {
    multiplier: 1.05,
    dealer_order_message:
      "Your inventory may now need replenishing. Would you like to repeat your last order or customize a new one?",
    dealer_payment_message:
      "Your payment is now due. Let us know if you’d like to discuss payment options.",
    sales_order_action:
      "Action prompt. Create mild urgency with concrete ordering options.",
    sales_payment_action:
      "Encourage immediate payment with flexible options, if applicable.",
    channel: "Call, then WhatsApp",
  },
  "Phase 5": {
    multiplier: 1.2,
    dealer_order_message:
      "We noticed you haven't placed your usual order. Is everything okay? We're here to help if you need assistance.",
    dealer_payment_message:
      "Your payment is overdue. Please reach out if you need any support to settle it.",
    sales_order_action:
      "Priority follow-up. Customer is overdue - personal outreach needed.",
    sales_payment_action: "Escalate overdue payment with a personal touch.",
    channel: "Personal Call",
  },
};

export { reminderCategoryRules, reminderPhases };
