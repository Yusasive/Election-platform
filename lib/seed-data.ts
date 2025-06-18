import connectDB from './mongodb';
import Position from '@/models/Position';
import Candidate from '@/models/Candidate';
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
    position: "Public Relations Officer {PRO}",
    allowMultiple: false,
  },
  {
    position: "Student Representative Councils {Statistics}",
    allowMultiple: true,
  },
  {
    position: "Student Representative Councils {Chemistry}",
    allowMultiple: true,
  },
  {
    position: "Student Representative Councils {Statistic}",
    allowMultiple: true,
  },
  {
    position: "Student Representative Councils {Geology}",
    allowMultiple: true,
  },
  {
    position: "Student Representative Councils {Industrial Chemistry}",
    allowMultiple: true,
  },
];

const defaultCandidates = [
  { id: 1, name: "Aiyenimelo Samuel Oluwapelumi", position: "General Secretary" },
  { id: 2, name: "Oke Phillip Olamilekan", position: "Sport Secretary" },
  { id: 3, name: "Abdulazeez Abdulsalam", position: "Sport Secretary" },
  { id: 4, name: "Wisdom Ajabor", position: "Social Secretary" },
  { id: 5, name: "Ayoade Kaosarat Adenike", position: "Social Secretary" },
  { id: 6, name: "Fakunle Precious Irene", position: "Social Secretary" },
  { id: 7, name: "Oraka Samuel Toluwanimi", position: "Public Relations Officer {PRO}" },
  { id: 8, name: "Babatunde Precious Micheal", position: "Student Representative Councils {Statistics}" },
  { id: 9, name: "Badmus Quwan Omobolanle", position: "Student Representative Councils {Statistics}" },
  { id: 10, name: "Oladipo Joseph", position: "Student Representative Councils {Statistics}" },
  { id: 11, name: "Abdulwahab Abdulqudus Olanrewaju", position: "Student Representative Councils {Statistics}" },
  { id: 12, name: "Taiwo Oluwasemilore Elizabeth", position: "Student Representative Councils {Chemistry}" },
  { id: 13, name: "Gaga Precious Rachel", position: "Student Representative Councils {Statistic}" },
  { id: 14, name: "Sheriff Abdulazeez", position: "Student Representative Councils {Statistic}" },
  { id: 15, name: "Adeyemi Gideon Oluwatimileyin", position: "Student Representative Councils {Geology}" },
  { id: 16, name: "Malik Usamot Temitope", position: "Student Representative Councils {Geology}" },
  { id: 17, name: "Warith Opeyemi Bakare", position: "Student Representative Councils {Industrial Chemistry}" },
  { id: 18, name: "Adeniyi Daniel", position: "Student Representative Councils {Industrial Chemistry}" },
];

export async function seedDatabase() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if data already exists
    const existingPositions = await Position.countDocuments();
    const existingCandidates = await Candidate.countDocuments();
    const existingSettings = await ElectionSettings.countDocuments();

    if (existingPositions === 0) {
      console.log('Seeding positions...');
      await Position.insertMany(defaultPositions);
      console.log('Positions seeded successfully');
    }

    if (existingCandidates === 0) {
      console.log('Seeding candidates...');
      await Candidate.insertMany(defaultCandidates);
      console.log('Candidates seeded successfully');
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

    console.log('Database seeding completed');
    return { success: true };
  } catch (error) {
    console.error('Database seeding failed:', error);
    return { success: false, error };
  }
}