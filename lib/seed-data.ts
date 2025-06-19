import connectDB from './mongodb';
import ElectionSettings from '@/models/ElectionSettings';
import mongoose from 'mongoose';

export async function seedDatabase() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clean up any problematic indexes
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      
      // Check if users collection exists and has problematic indexes
      const usersCollection = collections.find(col => col.name === 'users');
      if (usersCollection) {
        const indexes = await db.collection('users').indexes();
        console.log('Current user indexes:', indexes.map(idx => idx.name));
        
        // Drop the problematic email index if it exists
        const emailIndex = indexes.find(idx => idx.key && idx.key.email);
        if (emailIndex) {
          console.log('Dropping problematic email index...');
          await db.collection('users').dropIndex('email_1');
          console.log('Email index dropped successfully');
        }
      }
    } catch (indexError) {
      console.log('Index cleanup completed (some operations may have been skipped)');
    }

    // Check if settings already exist
    const existingSettings = await ElectionSettings.countDocuments();

    if (existingSettings === 0) {
      console.log('Creating default election settings...');
      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(6, 0, 0, 0);
      const endTime = new Date(now);
      endTime.setHours(20, 0, 0, 0);

      await ElectionSettings.create({
        votingStartTime: startTime,
        votingEndTime: endTime,
        loginDuration: 35,
        isVotingActive: false,
      });
      console.log('Election settings created successfully');
    }

    console.log('Database initialization completed - Fresh setup ready');
    return { success: true };
  } catch (error) {
    console.error('Database initialization failed:', error);
    return { success: false, error };
  }
}