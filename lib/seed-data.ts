import connectDB from './mongodb';
import Position from '@/models/Position';
import ElectionSettings from '@/models/ElectionSettings';

const defaultPositions = [
  {
    position: "General Secretary",
    allowMultiple: false,
  },
  {
    position: "Sport Secretary", 
    allowMultiple: false,
  },
  {
    position: "Social Secretary",
    allowMultiple: false,
  },
  {
    position: "Public Relations Officer",
    allowMultiple: false,
  },
  {
    position: "Student Representative Council",
    allowMultiple: true,
  },
];

export async function seedDatabase() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if data already exists
    const existingPositions = await Position.countDocuments();
    const existingSettings = await ElectionSettings.countDocuments();

    if (existingPositions === 0) {
      console.log('Seeding basic positions...');
      await Position.insertMany(defaultPositions);
      console.log('Basic positions seeded successfully');
    }

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

    console.log('Database seeding completed - Ready for admin to add candidates');
    return { success: true };
  } catch (error) {
    console.error('Database seeding failed:', error);
    return { success: false, error };
  }
}