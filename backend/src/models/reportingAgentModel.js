import SQLDatabase from "../databases/sql.js";

class ReportingAgentDB {
  constructor() {
    // Use existing SQL database connection pool
    this.pool = null;
  }

  async getPool() {
    if (!this.pool) {
      this.pool = await SQLDatabase.createPool(process.env.SQL_DB_NAME);
    }
    return this.pool;
  }

  async initTables() {
    const pool = await this.getPool();
    const connection = await pool.getConnection();
    try {
      console.log('Creating reporting agent tables...');

      // Report Schedules Table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS report_schedules (
          id INT AUTO_INCREMENT PRIMARY KEY,
          report_type ENUM('cash_flow_projection', 'profit_loss', 'cash_flow_statement', 'ratio_analysis', 'expense_analysis') NOT NULL,
          frequency ENUM('one-time', 'daily', 'weekly', 'monthly') NOT NULL,
          emails JSON NOT NULL,
          from_date DATE,
          to_date DATE,
          time TIME,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_active_schedules (is_active, frequency),
          INDEX idx_created_at (created_at)
        )
      `);

      // Alert Thresholds Table  
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS alert_thresholds (
          id INT AUTO_INCREMENT PRIMARY KEY,
          metric VARCHAR(100) NOT NULL,
          threshold DECIMAL(15,2) NOT NULL,
          condition_type ENUM('greater_than', 'less_than', 'equals') NOT NULL,
          emails JSON NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          last_triggered TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_active_alerts (is_active),
          INDEX idx_metric (metric)
        )
      `);

      // Report Assignments Table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS report_assignments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          report_type VARCHAR(100) NOT NULL,
          assignee_email VARCHAR(255) NOT NULL,
          assignee_name VARCHAR(255) NOT NULL,
          message TEXT,
          due_date DATE,
          priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
          status ENUM('assigned', 'in_progress', 'completed') DEFAULT 'assigned',
          assigned_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_assignee (assignee_email),
          INDEX idx_status (status),
          INDEX idx_due_date (due_date)
        )
      `);

      console.log('Reporting agent tables created successfully');
      
      // Update existing schema if needed
      await this.updateSchema(connection);
      
    } catch (error) {
      console.error('Error creating reporting agent tables:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateSchema(connection) {
    try {
      console.log('🔄 Checking and updating schema...');
      
      // Check current ENUM values for report_type
      const [columns] = await connection.execute(`
        SELECT COLUMN_TYPE 
        FROM information_schema.columns 
        WHERE table_schema = ? AND table_name = 'report_schedules' AND column_name = 'report_type'
      `, [process.env.SQL_DB_NAME]);
      
      if (columns.length > 0) {
        const currentEnum = columns[0].COLUMN_TYPE;
        console.log('📋 Current report_type ENUM:', currentEnum);
        
        // Check if new values are already included
        if (!currentEnum.includes('ratio_analysis') || !currentEnum.includes('expense_analysis')) {
          console.log('🔧 Updating report_type ENUM to include new values...');
          
          // Alter the ENUM to include new values
          await connection.execute(`
            ALTER TABLE report_schedules 
            MODIFY COLUMN report_type ENUM(
              'cash_flow_projection', 
              'profit_loss', 
              'cash_flow_statement', 
              'ratio_analysis', 
              'expense_analysis'
            ) NOT NULL
          `);
          
          console.log('✅ Successfully updated report_type ENUM');
        }
      }
      
      // Check current ENUM values for frequency
      const [freqColumns] = await connection.execute(`
        SELECT COLUMN_TYPE 
        FROM information_schema.columns 
        WHERE table_schema = ? AND table_name = 'report_schedules' AND column_name = 'frequency'
      `, [process.env.SQL_DB_NAME]);
      
      if (freqColumns.length > 0) {
        const currentFreqEnum = freqColumns[0].COLUMN_TYPE;
        
        if (!currentFreqEnum.includes('one-time')) {
          console.log('🔧 Updating frequency ENUM to include one-time...');
          
          await connection.execute(`
            ALTER TABLE report_schedules 
            MODIFY COLUMN frequency ENUM(
              'one-time',
              'daily', 
              'weekly', 
              'monthly'
            ) NOT NULL
          `);
          
          console.log('✅ Successfully updated frequency ENUM');
        }
      }
      
      // Check if time column is nullable
      const [timeColumns] = await connection.execute(`
        SELECT IS_NULLABLE 
        FROM information_schema.columns 
        WHERE table_schema = ? AND table_name = 'report_schedules' AND column_name = 'time'
      `, [process.env.SQL_DB_NAME]);
      
      if (timeColumns.length > 0 && timeColumns[0].IS_NULLABLE === 'NO') {
        console.log('🔧 Making time column nullable...');
        await connection.execute(`
          ALTER TABLE report_schedules 
          MODIFY COLUMN time TIME NULL
        `);
        console.log('✅ Successfully made time column nullable');
      }
      
      console.log('✅ Schema update completed');
    } catch (error) {
      console.error('❌ Error updating schema:', error);
      // Don't throw error - allow table creation to continue
      console.warn('⚠️  Continuing with table creation despite schema update issues');
    }
  }

  // ==================== SCHEDULES ====================
  
  async createSchedule(schedule) {
    try {
      const pool = await this.getPool();
      
      // Ensure emails is an array and properly formatted
      let emails = schedule.emails;
      if (!Array.isArray(emails)) {
        emails = [emails].filter(Boolean);
      }
      
      const [result] = await pool.execute(
        `INSERT INTO report_schedules (report_type, frequency, emails, from_date, to_date, time, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          schedule.reportType,
          schedule.frequency,
          JSON.stringify(emails), // Ensure proper JSON formatting
          schedule.fromDate || null,
          schedule.toDate || null,
          schedule.time,
          schedule.isActive
        ]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }

  async getAllSchedules() {
    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM report_schedules ORDER BY created_at DESC'
      );
      return rows.map(row => {
        // Safely parse emails JSON with fallback
        let emails;
        try {
          emails = typeof row.emails === 'string' ? JSON.parse(row.emails) : row.emails;
          // Ensure emails is an array
          if (!Array.isArray(emails)) {
            emails = [emails].filter(Boolean); // Convert single email to array
          }
        } catch (jsonError) {
          console.warn(`Invalid JSON in emails field for schedule ${row.id}:`, row.emails);
          // If it's a simple string, treat it as a single email
          emails = [row.emails].filter(Boolean);
        }
        
        return {
          id: row.id.toString(), // Convert to string for consistency
          reportType: row.report_type,
          frequency: row.frequency,
          emails,
          fromDate: row.from_date,
          toDate: row.to_date,
          time: row.time,
          isActive: Boolean(row.is_active),
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      });
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  }

  async getActiveSchedules() {
    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM report_schedules WHERE is_active = TRUE ORDER BY created_at DESC'
      );
      return rows.map(row => {
        // Safely parse emails JSON with fallback
        let emails;
        try {
          emails = typeof row.emails === 'string' ? JSON.parse(row.emails) : row.emails;
          // Ensure emails is an array
          if (!Array.isArray(emails)) {
            emails = [emails].filter(Boolean);
          }
        } catch (jsonError) {
          console.warn(`Invalid JSON in emails field for active schedule ${row.id}:`, row.emails);
          emails = [row.emails].filter(Boolean);
        }
        
        return {
          id: row.id.toString(),
          reportType: row.report_type,
          frequency: row.frequency,
          emails,
          fromDate: row.from_date,
          toDate: row.to_date,
          time: row.time,
          isActive: Boolean(row.is_active),
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      });
    } catch (error) {
      console.error('Error fetching active schedules:', error);
      throw error;
    }
  }

  async updateScheduleStatus(id, isActive) {
    try {
      const pool = await this.getPool();
      await pool.execute(
        'UPDATE report_schedules SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [isActive, id]
      );
    } catch (error) {
      console.error('Error updating schedule status:', error);
      throw error;
    }
  }

  async deleteSchedule(id) {
    try {
      const pool = await this.getPool();
      await pool.execute('DELETE FROM report_schedules WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }

  // ==================== ALERTS ====================

  async createAlert(alert) {
    try {
      const pool = await this.getPool();
      
      // Ensure emails is an array and properly formatted
      let emails = alert.emails;
      if (!Array.isArray(emails)) {
        emails = [emails].filter(Boolean);
      }
      
      const [result] = await pool.execute(
        `INSERT INTO alert_thresholds (metric, threshold, condition_type, emails, is_active) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          alert.metric,
          alert.threshold,
          alert.condition,
          JSON.stringify(emails), // Ensure proper JSON formatting
          alert.isActive
        ]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  async getAllAlerts() {
    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM alert_thresholds ORDER BY created_at DESC'
      );
      return rows.map(row => {
        // Safely parse emails JSON with fallback
        let emails;
        try {
          emails = typeof row.emails === 'string' ? JSON.parse(row.emails) : row.emails;
          // Ensure emails is an array
          if (!Array.isArray(emails)) {
            emails = [emails].filter(Boolean);
          }
        } catch (jsonError) {
          console.warn(`Invalid JSON in emails field for alert ${row.id}:`, row.emails);
          emails = [row.emails].filter(Boolean);
        }
        
        return {
          id: row.id.toString(),
          metric: row.metric,
          threshold: parseFloat(row.threshold),
          condition: row.condition_type, // Map condition_type to condition for frontend compatibility
          emails,
          isActive: Boolean(row.is_active),
          lastTriggered: row.last_triggered,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }

  async getActiveAlerts() {
    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM alert_thresholds WHERE is_active = TRUE'
      );
      return rows.map(row => {
        // Safely parse emails JSON with fallback
        let emails;
        try {
          emails = typeof row.emails === 'string' ? JSON.parse(row.emails) : row.emails;
          // Ensure emails is an array
          if (!Array.isArray(emails)) {
            emails = [emails].filter(Boolean);
          }
        } catch (jsonError) {
          console.warn(`Invalid JSON in emails field for active alert ${row.id}:`, row.emails);
          emails = [row.emails].filter(Boolean);
        }
        
        return {
          id: row.id.toString(),
          metric: row.metric,
          threshold: parseFloat(row.threshold),
          condition: row.condition_type,
          emails,
          isActive: Boolean(row.is_active),
          lastTriggered: row.last_triggered,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      });
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      throw error;
    }
  }

  async updateAlertStatus(id, isActive) {
    try {
      const pool = await this.getPool();
      await pool.execute(
        'UPDATE alert_thresholds SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [isActive, id]
      );
    } catch (error) {
      console.error('Error updating alert status:', error);
      throw error;
    }
  }

  async updateAlertLastTriggered(id) {
    try {
      const pool = await this.getPool();
      await pool.execute(
        'UPDATE alert_thresholds SET last_triggered = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error updating alert last triggered:', error);
      throw error;
    }
  }

  async deleteAlert(id) {
    try {
      const pool = await this.getPool();
      await pool.execute('DELETE FROM alert_thresholds WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  }

  // ==================== ASSIGNMENTS ====================

  async createAssignment(assignment) {
    try {
      const pool = await this.getPool();
      const [result] = await pool.execute(
        `INSERT INTO report_assignments (report_type, assignee_email, assignee_name, message, due_date, priority, assigned_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          assignment.reportType,
          assignment.assigneeEmail,
          assignment.assigneeName,
          assignment.message,
          assignment.dueDate,
          assignment.priority,
          assignment.assignedBy
        ]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }

  async getAllAssignments() {
    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM report_assignments ORDER BY created_at DESC'
      );
      return rows.map(row => ({
        id: row.id.toString(),
        reportType: row.report_type,
        assigneeEmail: row.assignee_email,
        assigneeName: row.assignee_name,
        message: row.message,
        dueDate: row.due_date,
        priority: row.priority,
        status: row.status,
        assignedBy: row.assigned_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  }

  async updateAssignmentStatus(id, status) {
    try {
      const pool = await this.getPool();
      await pool.execute(
        'UPDATE report_assignments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );
    } catch (error) {
      console.error('Error updating assignment status:', error);
      throw error;
    }
  }

  async deleteAssignment(id) {
    try {
      const pool = await this.getPool();
      await pool.execute('DELETE FROM report_assignments WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  }

  // ==================== UTILITY ====================

  async cleanupInvalidJsonData() {
    try {
      const pool = await this.getPool();
      
      // Fix report_schedules table
      const [schedules] = await pool.execute('SELECT id, emails FROM report_schedules');
      for (const schedule of schedules) {
        try {
          JSON.parse(schedule.emails);
        } catch (error) {
          // Fix invalid JSON
          console.log(`Fixing invalid email JSON for schedule ${schedule.id}: ${schedule.emails}`);
          const fixedEmails = JSON.stringify([schedule.emails]);
          await pool.execute(
            'UPDATE report_schedules SET emails = ? WHERE id = ?',
            [fixedEmails, schedule.id]
          );
        }
      }
      
      // Fix alert_thresholds table
      const [alerts] = await pool.execute('SELECT id, emails FROM alert_thresholds');
      for (const alert of alerts) {
        try {
          JSON.parse(alert.emails);
        } catch (error) {
          // Fix invalid JSON
          console.log(`Fixing invalid email JSON for alert ${alert.id}: ${alert.emails}`);
          const fixedEmails = JSON.stringify([alert.emails]);
          await pool.execute(
            'UPDATE alert_thresholds SET emails = ? WHERE id = ?',
            [fixedEmails, alert.id]
          );
        }
      }
      
      console.log('Database cleanup completed successfully');
    } catch (error) {
      console.error('Error during database cleanup:', error);
    }
  }

  async testConnection() {
    try {
      // First ensure the pool is created
      const pool = await this.getPool();
      
      // Test the connection using the pool
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      
      console.log('Reporting Agent database connection successful');
      return true;
    } catch (error) {
      console.error('Reporting Agent database connection failed:', error);
      return false;
    }
  }
}

export default ReportingAgentDB;
