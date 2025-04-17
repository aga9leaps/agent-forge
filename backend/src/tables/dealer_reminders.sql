CREATE TABLE dealer_reminders (
    reminder_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255),
    rule_id INT,
    expected_action_date DATE,
    reminder_date DATE,
    reminder_type VARCHAR(50),
    status VARCHAR(255) DEFAULT 'Pending',
    effectiveness VARCHAR(255) DEFAULT 'Unknown',
    notes TEXT,
    whatsapp_message_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (customer_name, status),
    INDEX (reminder_date),
    FOREIGN KEY (rule_id) REFERENCES reminder_rules(rule_id)
);