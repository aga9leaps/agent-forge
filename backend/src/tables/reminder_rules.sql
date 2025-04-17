CREATE TABLE reminder_rules (
    rule_id INT AUTO_INCREMENT PRIMARY KEY,
    category_type VARCHAR(255),
    category VARCHAR(255),
    reminder_phase VARCHAR(255),
    interval_multiplier DECIMAL(10, 2),
    timing_precision VARCHAR(255),
    communication_channel VARCHAR(255),
    dealer_order_message_template TEXT,
    dealer_payment_message_template TEXT,
    sales_team_action_for_order TEXT,
    sales_team_action_for_payments TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);