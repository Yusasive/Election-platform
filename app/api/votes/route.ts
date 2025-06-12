import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vote from '@/models/Vote';
import User from '@/models/User';
import { getClientIP } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { matricNumber, votes } = await request.json();

    if (!matricNumber || !votes) {
      return NextResponse.json(
        { error: 'Matric number and votes are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ matricNumber: matricNumber.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has already voted
    if (user.hasVoted) {
      return NextResponse.json(
        { error: 'User has already voted' },
        { status: 409 }
      );
    }

    // Format votes for database
    const formattedVotes = Object.entries(votes).map(([position, candidateIds]) => ({
      position,
      candidateIds: Array.isArray(candidateIds) ? candidateIds : [candidateIds as string],
    }));

    // Create vote record
    const vote = new Vote({
      matricNumber: user.matricNumber,
      userId: user._id,
      votes: formattedVotes,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || '',
    });

    await vote.save();

    // Mark user as voted
    user.hasVoted = true;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Vote recorded successfully',
    });
  } catch (error) {
    console.error('Vote submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const votes = await Vote.find({})
      .populate('userId', 'fullName department')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      votes,
    });
  } catch (error) {
    console.error('Votes fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}