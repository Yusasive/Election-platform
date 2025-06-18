import connectDB from './mongodb';
import ElectionSettings from '@/models/ElectionSettings';

export async function seedDatabase() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

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

    console.log('Database initialization completed - Completely fresh for admin to create everything');
    return { success: true };
  } catch (error) {
    console.error('Database initialization failed:', error);
    return { success: false, error };
  }
}