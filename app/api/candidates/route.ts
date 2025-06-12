import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import Position from '@/models/Position';
import { sanitizeInput } from '@/lib/utils';

export async function GET() {
  try {
    await connectDB();

    // Get all positions with their candidates
    const positions = await Position.find({ isActive: true }).sort({ position: 1 });
    const candidates = await Candidate.find({}).sort({ id: 1 });

    // Group candidates by position
    const positionsWithCandidates = positions.map(pos => ({
      position: pos.position,
      allowMultiple: pos.allowMultiple,
      candidates: candidates.filter(candidate => candidate.position === pos.position)
        .map(candidate => ({
          id: candidate.id,
          name: candidate.name,
        })),
    }));

    return NextResponse.json({
      success: true,
      positions: positionsWithCandidates,
    });
  } catch (error) {
    console.error('Candidates fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, position } = await request.json();

    if (!name || !position) {
      return NextResponse.json(
        { error: 'Name and position are required' },
        { status: 400 }
      );
    }

    // Check if position exists
    const existingPosition = await Position.findOne({ position });
    if (!existingPosition) {
      return NextResponse.json(
        { error: 'Position does not exist' },
        { status: 404 }
      );
    }

    // Get next candidate ID
    const lastCandidate = await Candidate.findOne().sort({ id: -1 });
    const nextId = lastCandidate ? lastCandidate.id + 1 : 1;

    // Create new candidate
    const candidate = new Candidate({
      id: nextId,
      name: sanitizeInput(name),
      position: sanitizeInput(position),
    });

    await candidate.save();

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        position: candidate.position,
      },
    });
  } catch (error) {
    console.error('Candidate creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { id, name } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    const candidate = await Candidate.findOneAndUpdate(
      { id },
      { name: sanitizeInput(name) },
      { new: true }
    );

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        position: candidate.position,
      },
    });
  } catch (error) {
    console.error('Candidate update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    const candidate = await Candidate.findOneAndDelete({ id: parseInt(id) });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Candidate deleted successfully',
    });
  } catch (error) {
    console.error('Candidate deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}