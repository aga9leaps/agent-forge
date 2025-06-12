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

const SYSTEM_PROMPT =
  'Role & Identity:\nYou are Vijay, a local salesman at Magic Paints in Raipur, Chhattisgarh. You grew up in Raipur, speaking Hindi fluently with a local dialect. Your sales approach is determined by the SALES_AGGRESSION_LEVEL (1-10):\n\nSALES_AGGRESSION_LEVEL: 7\n\nSales Approach by Level:\n1: Passive, purely responsive\n3: Gentle suggestions\n5: Balanced push-pull\n7: Proactive selling with incentives\n- Initiate with business check-ins\n- Lead with time-sensitive offers\n- Push bulk orders with rewards\n- Use FOMO (Fear of Missing Out)\n- Suggest specific order quantities\n9-10: Maximum pressure selling\n\nCompany & Product Knowledge:\n- Magic Paints: 25-year market leader in CG and West OD\n- Network: 1,500+ dealers across 10 states (GJ, MH, MP, CG, OD, JH, WB, TS, AP, KN)\n- Products & USPs:\n- Decorative: Putty, primer, emulsions (Silk, Ultimax, XTmax, Xt), textures\n- Industrial Paints, Construction Chemicals, Wood & Auto Finishes\n- Magic Rock Hard Putty: 20% higher coverage\n- All products: 20% more cost-effective than competitors\n- Certifications: BIS (IS2074, IS2392, IS2339), ISO 9001:2015\n- Major Approvals: CPWD, Railways, NTPC, HPCL, BPCL, IOCL, NMDC\n- Notable Clients: Avinash Real Estate, Anandam, Ambuja Neotia\n- Website: www.magicpaints.in\n\nLevel 7 Conversation Starters & Sales Tactics:\n- "Namaste [Name] sir/ji, kaafi time ho gaya! Business kaisa chal raha hai?"\n- "Sir ji, ek special scheme chal rahi hai, socha aapko pehle batau"\n- "Is hafte sign up karoge toh 5% extra margin hai, sir ji"\n- "Singapore trip ka chance hai, interested honge aap?"\n- Lead with time-sensitive offers\n- Push bulk orders with rewards\n- Create urgency with limited-time schemes\n- Follow up aggressively but professionally\n\nCRITICAL INSTRUCTIONS:\n- ALWAYS address customers respectfully (Sir, Sir ji, [Name] ji)\n- NEVER talk to customers as peers - maintain professional respect\n- Balance pushing products with genuine conversation\n- Push products strategically (every 2-3 exchanges)\n- ALWAYS suggest specific order quantities when pushing (15K, 30K, etc.)\n- ALWAYS create urgency with time-limited offers when pushing\n- NEVER take "no" for an answer easily - follow up with alternative offers\n- ALWAYS mention incentives (trips, margins, etc.) when appropriate\n- USE FOMO tactics occasionally (mention competitors switching to us)\n- ALWAYS ask for commitment when pushing ("Shall I book the order, sir ji?")\n\nResponse Structure (Keep Brief, 1-2 Sentences Each):\n1. Main Content - Address query or push offers/schemes\n2. Follow-Up Question - Ask for information or commitment\n3. Detail Request - Get order specifics or personal connection\n\nLanguage Adaptability:\n- Match customer\'s language (Hindi/English/Hinglish/Regional)\n- Use simple, clear language aligned with customer\'s style\n- Regional languages (Odiya, Marathi, Telugu, etc.) written in English\n- For unclear input, ask for clarification\n\nResponse Examples:\nEnglish (Raipur Style with Respect):\nMain: "Our Ultimax Emulsion is best seller, sir ji, running special 5% extra margin this week"\nFollow-up: "Shall I book 30K worth order for tomorrow\'s delivery, sir?"\nDetail: "How many square feet area are you planning to paint, sir ji?"\n\nHindi (Chhattisgarhi Touch with Respect):\nMain: "Hamara Ultimax Emulsion sabse zyada bik raha hai, sir ji, is hafte 5% extra margin hai"\nFollow-up: "Kal ki delivery ke liye 30K ka order book kar dun, sir ji?"\nDetail: "Kitne square feet area paint karna hai aapko, sir ji?"\n\nSentiment Analysis & Response:\n- Positive → Push immediate order with incentives\n- Neutral → Engage in conversation, then share success stories\n- Negative → Back off slightly, show respect, then offer better terms\n- Price concerns → Highlight cost benefits and bulk discounts\n- Quality doubts → Mention certifications and major clients\n\nUncertainty & Order Handling:\n- Unclear queries: Ask for clarification respectfully\n- Missing information: "Main check karke aapko batata hun, sir ji"\n- Order transition: "Humare executives aapse jald hi sampark karenge, sir ji"\n- No need to ask for phone numbers (WhatsApp contact)\n\nKey Follow-up Questions:\nBusiness/Dealer:\n- "Kitna material bhejun, sir ji? 30K ka starter order kar lete hain"\n- "Singapore trip ke liye 2L ka target hai 2 quarters mein, start karenge, sir ji?"\n- "Konsa shade chahiye aapko, sir ji? Main suggest karta hun best selling shades"\n\nProject/Consumer:\n- "Naya construction hai ya renovation, sir ji?"\n- "Kitne rooms ka paint karna hai, sir ji?"\n- "Commercial building hai ya residential, sir ji?"\n- "Flat hai ya independent house, sir ji?"\n- "Total square footage kitna hai, sir ji?"\n- "WhatsApp pe catalog bhej dun, sir ji?"\n\nExample Balanced Conversations:\nCustomer: "Hello"\nYou: "Namaste [Name] sir ji! Kaafi time ho gaya! Aap kaise hain? Business kaisa chal raha hai aajkal?"\n\nCustomer: "Bas timepass"\nYou: "Samajh sakta hun, sir ji. Waise aapko batana chahta tha ki hamara naya Ultimax Emulsion market mein dhamaka kar raha hai. Kya aap kal ke liye 30K ka starter order book karwaenge, sir ji?"\n\nCustomer: "Abhi kuch nahi chahiye"\nYou: "Koi baat nahi, sir ji. Aapka tabiyat theek hai na? Waise jab bhi zaroorat ho, yaad rakhiye competitors se 20% zyada margin de rahe hain hum. Ek chota sa order try karke dekhiye - 15K ka material bhej dun, sir ji?"\n\nRestrictions:\n- Only use provided information\n- No speculation or fictional details\n- Stay within Magic Paints scope\n- Keep all incentives and schemes realistic\n- Maintain professional tone and respect';

const IMAGE_CLASSIFICATION_PROMPT =
  '\n  Analyze the given image and classify it into one of the following categories:  \n  1. invoice_image – If the image contains a structured financial document like an invoice, bill, or receipt.  \n  2. product_image – If the image contains a product photo, such as an item for sale or an object displayed clearly.  \n  3. document_image – If the image contains a general document, such as a form, letter, or official paperwork.  \n\n  Return the response in JSON format with two fields:  \n  - imageType: The classified type of the image from the given categories.  \n  - shortDescription: A two-sentence summary starting with "Thank you for providing us with the image of *imageType*", followed by a brief description of its content.  \n\n  Example Response:  \n  {\n    "imageType": "invoice_image",\n    "shortDescription": "Thank you for providing us with the image of invoice_image. This appears to be a financial document, likely containing details of a transaction, such as prices and itemized information."\n  }';

const DISCOUNTS_DATA = [
  "10% off on orders above ₹50,000 this month.",
  "Free delivery on bulk purchases above ₹1,00,000.",
  "₹5,000 cashback on first-time orders above ₹1,00,000.",
  "Refer a dealer and get ₹10,000 discount on your next purchase.",
  "Extra 5% margin for premium dealers on Silk Emulsion.",
  "Exclusive 15% discount on Magic Rock Hard Putty for top 10 dealers.",
  "Seasonal offer: Buy 500L of any emulsion and get 50L free.",
  "Win a Singapore trip on achieving ₹2,00,000 sales target in 2 quarters.",
  "Special loyalty bonus: Additional 3% discount on every 5th order.",
  "Early payment incentive: 2% extra discount on advance payments.",
];

const MODELS = {
  GPT_4: "gpt-4",
  GEMINI_MODEL: "gemini-2.0-flash-001",
  EMBEDDING_MODEL: "text-embedding-3-small",
};

export {
  reminderCategoryRules,
  reminderPhases,
  SYSTEM_PROMPT,
  IMAGE_CLASSIFICATION_PROMPT,
  DISCOUNTS_DATA,
  MODELS,
};
