import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: './configs/.env' });

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGODB_NAME;

async function cleanupInvalidCronJobs() {
  console.log('🧹 Starting cleanup of invalid cron jobs...');
  
  if (!MONGO_URI || !DB_NAME) {
    console.error('❌ Missing MongoDB configuration in .env file');
    return;
  }

  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const mpTasksCollection = db.collection('mp_tasks');
    const tasksCollection = db.collection('tasks');
    
    // Fix MP Tasks with invalid cron time
    console.log('🔍 Checking mp_tasks collection...');
    
    const invalidMPTasks = await mpTasksCollection.find({
      $or: [
        { cronTime: null },
        { cronTime: "" },
        { cronTime: { $exists: false } }
      ],
      scheduleType: 'scheduled'
    }).toArray();
    
    console.log(`Found ${invalidMPTasks.length} invalid MP tasks`);
    
    if (invalidMPTasks.length > 0) {
      const result = await mpTasksCollection.updateMany(
        { 
          $or: [
            { cronTime: null },
            { cronTime: "" },
            { cronTime: { $exists: false } }
          ],
          scheduleType: 'scheduled'
        },
        { 
          $set: { 
            isActive: false,
            status: 'failed',
            updatedAt: new Date(),
            cronTime: null
          } 
        }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} invalid MP tasks`);
    }
    
    // Fix regular tasks with invalid cron time
    console.log('🔍 Checking tasks collection...');
    
    const invalidTasks = await tasksCollection.find({
      $or: [
        { cronTime: null },
        { cronTime: "" },
        { cronTime: { $exists: false } }
      ],
      isActive: true
    }).toArray();
    
    console.log(`Found ${invalidTasks.length} invalid tasks`);
    
    if (invalidTasks.length > 0) {
      const result2 = await tasksCollection.updateMany(
        {
          $or: [
            { cronTime: null },
            { cronTime: "" },
            { cronTime: { $exists: false } }
          ],
          isActive: true
        },
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log(`✅ Updated ${result2.modifiedCount} invalid tasks`);
    }
    
    // Remove campaigns that are immediate but somehow have cron entries
    console.log('🔍 Cleaning up immediate campaigns with cron entries...');
    
    const immediateWithCron = await mpTasksCollection.find({
      scheduleType: 'immediate',
      cronTime: { $ne: null }
    }).toArray();
    
    console.log(`Found ${immediateWithCron.length} immediate campaigns with cron entries`);
    
    if (immediateWithCron.length > 0) {
      const result3 = await mpTasksCollection.updateMany(
        {
          scheduleType: 'immediate'
        },
        {
          $set: {
            cronTime: null,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Cleaned ${result3.modifiedCount} immediate campaigns`);
    }
    
    console.log('🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await client.close();
    console.log('📝 Database connection closed');
  }
}

// Run the cleanup
cleanupInvalidCronJobs().then(() => {
  console.log('✅ Cleanup script finished');
  process.exit(0);
}).catch(error => {
  console.error('❌ Cleanup script failed:', error);
  process.exit(1);
});
