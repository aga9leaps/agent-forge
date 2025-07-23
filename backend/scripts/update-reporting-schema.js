import { SQLDatabase } from "../src/databases/SQLDatabase.js";

async function updateReportingAgentSchema() {
  let connection;
  try {
    console.log('🔄 Updating Reporting Agent database schema...');
    
    const pool = await SQLDatabase.createPool(process.env.SQL_DB_NAME);
    connection = await pool.getConnection();
    
    // Check if the table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'report_schedules'
    `, [process.env.SQL_DB_NAME]);
    
    if (tables.length === 0) {
      console.log('ℹ️  report_schedules table does not exist. It will be created with the correct schema.');
      return;
    }
    
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
      if (currentEnum.includes('ratio_analysis') && currentEnum.includes('expense_analysis')) {
        console.log('✅ Schema is already up to date!');
        return;
      }
      
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
    
    // Check current ENUM values for frequency (should already be updated)
    const [freqColumns] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM information_schema.columns 
      WHERE table_schema = ? AND table_name = 'report_schedules' AND column_name = 'frequency'
    `, [process.env.SQL_DB_NAME]);
    
    if (freqColumns.length > 0) {
      const currentFreqEnum = freqColumns[0].COLUMN_TYPE;
      console.log('📋 Current frequency ENUM:', currentFreqEnum);
      
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
    
    // Make time column nullable (for one-time reports)
    console.log('🔧 Making time column nullable...');
    await connection.execute(`
      ALTER TABLE report_schedules 
      MODIFY COLUMN time TIME NULL
    `);
    
    console.log('✅ Database schema update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateReportingAgentSchema()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { updateReportingAgentSchema };
