import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vote from '@/models/Vote';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();

    // Get all votes with user data
    const votes = await Vote.find({})
      .populate('userId', 'fullName department')
      .sort({ createdAt: -1 });

    // Calculate analytics
    const analytics = {
      totalVotes: votes.length,
      positionStats: {} as any,
      hourlyVotes: {} as any,
      departmentStats: {} as any,
    };

    // Process position statistics
    votes.forEach((vote) => {
      vote.votes.forEach((voteItem: any) => {
        const { position, candidateIds } = voteItem;
        
        if (!analytics.positionStats[position]) {
          analytics.positionStats[position] = {
            totalVotes: 0,
            candidates: {},
          };
        }

        analytics.positionStats[position].totalVotes++;

        candidateIds.forEach((candidateId: string) => {
          if (!analytics.positionStats[position].candidates[candidateId]) {
            analytics.positionStats[position].candidates[candidateId] = 0;
          }
          analytics.positionStats[position].candidates[candidateId]++;
        });
      });

      // Process hourly votes
      const hour = new Date(vote.createdAt).getHours();
      const hourKey = `${hour}:00`;
      analytics.hourlyVotes[hourKey] = (analytics.hourlyVotes[hourKey] || 0) + 1;
    });

    // Process department statistics
    const users = await User.find({});
    users.forEach((user) => {
      if (user.department) {
        analytics.departmentStats[user.department] = 
          (analytics.departmentStats[user.department] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}