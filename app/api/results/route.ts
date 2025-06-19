import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vote from '@/models/Vote';
import Candidate from '@/models/Candidate';
import Position from '@/models/Position';

export async function GET() {
  try {
    await connectDB();

    // Get all positions with their candidates
    const positions = await Position.find({ isActive: true })
      .sort({ position: 1 })
      .lean();

    const candidates = await Candidate.find({})
      .sort({ id: 1 })
      .lean();

    // Get all votes
    const votes = await Vote.find({})
      .populate('userId', 'fullName department')
      .lean();

    // Calculate results for each position
    const results = positions.map(position => {
      const positionCandidates = candidates.filter(c => c.position === position.position);
      
      // Count votes for each candidate
      const candidateVotes: { [key: string]: number } = {};
      let totalVotesForPosition = 0;

      // Initialize vote counts
      positionCandidates.forEach(candidate => {
        candidateVotes[candidate.id.toString()] = 0;
      });

      // Count votes from all vote records
      votes.forEach(vote => {
        const positionVote = vote.votes.find(v => v.position === position.position);
        if (positionVote) {
          totalVotesForPosition++;
          positionVote.candidateIds.forEach(candidateId => {
            if (candidateVotes[candidateId] !== undefined) {
              candidateVotes[candidateId]++;
            }
          });
        }
      });

      // Create results with candidate details
      const candidateResults = positionCandidates.map(candidate => {
        const voteCount = candidateVotes[candidate.id.toString()] || 0;
        const percentage = totalVotesForPosition > 0 
          ? ((voteCount / totalVotesForPosition) * 100).toFixed(1)
          : "0";

        return {
          id: candidate.id,
          name: candidate.name,
          nickname: candidate.nickname || '',
          department: candidate.department || '',
          level: candidate.level || '',
          votes: voteCount,
          percentage: parseFloat(percentage),
        };
      });

      // Sort by vote count (descending)
      candidateResults.sort((a, b) => b.votes - a.votes);

      return {
        position: position.position,
        allowMultiple: position.allowMultiple,
        totalVotes: totalVotesForPosition,
        candidates: candidateResults,
        winner: candidateResults.length > 0 ? candidateResults[0] : null,
      };
    });

    // Calculate overall statistics
    const totalVoters = votes.length;
    const totalCandidates = candidates.length;
    const totalPositions = positions.length;

    // Department breakdown
    const departmentStats: { [key: string]: number } = {};
    votes.forEach(vote => {
      if (vote.userId && vote.userId.department) {
        departmentStats[vote.userId.department] = 
          (departmentStats[vote.userId.department] || 0) + 1;
      }
    });

    // Hourly voting pattern
    const hourlyVotes: { [key: string]: number } = {};
    votes.forEach(vote => {
      const hour = new Date(vote.createdAt).getHours();
      const hourKey = `${hour}:00`;
      hourlyVotes[hourKey] = (hourlyVotes[hourKey] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      results: {
        positions: results,
        statistics: {
          totalVoters,
          totalCandidates,
          totalPositions,
          departmentStats,
          hourlyVotes,
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch election results',
        results: null,
      },
      { status: 500 }
    );
  }
}