import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import Position from '@/models/Position';
import { sanitizeInput } from '@/lib/utils';

export async function GET() {
  try {
    await connectDB();

    // Use aggregation pipeline for better performance
    const positionsWithCandidates = await Position.aggregate([
      { $match: { isActive: true } },
      { $sort: { position: 1 } },
      {
        $lookup: {
          from: 'candidates',
          localField: 'position',
          foreignField: 'position',
          as: 'candidates',
          pipeline: [
            { $sort: { id: 1 } },
            {
              $project: {
                id: 1,
                name: 1,
                nickname: { $ifNull: ['$nickname', ''] },
                image: { $ifNull: ['$image', ''] },
                department: { $ifNull: ['$department', ''] },
                level: { $ifNull: ['$level', ''] },
                position: 1,
                _id: 0
              }
            }
          ]
        }
      },
      {
        $project: {
          position: 1,
          allowMultiple: 1,
          candidates: 1,
          _id: 0
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      positions: positionsWithCandidates,
    });
  } catch (error) {
    console.error('Candidates fetch error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to load candidates. Please try again.',
        positions: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, nickname, image, department, level, position } = await request.json();

    if (!name || !position) {
      return NextResponse.json(
        { error: 'Name and position are required' },
        { status: 400 }
      );
    }

    // Check if position exists
    const existingPosition = await Position.findOne({ position }).lean();
    if (!existingPosition) {
      return NextResponse.json(
        { error: 'Position does not exist' },
        { status: 404 }
      );
    }

    // Get next candidate ID more efficiently
    const lastCandidate = await Candidate.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
    const nextId = lastCandidate ? lastCandidate.id + 1 : 1;

    // Create new candidate
    const candidateData = {
      id: nextId,
      name: sanitizeInput(name),
      nickname: nickname ? sanitizeInput(nickname) : '',
      image: image ? sanitizeInput(image) : '',
      department: department ? sanitizeInput(department) : '',
      level: level ? sanitizeInput(level) : '',
      position: sanitizeInput(position),
    };

    const candidate = new Candidate(candidateData);
    await candidate.save();

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        nickname: candidate.nickname,
        image: candidate.image,
        department: candidate.department,
        level: candidate.level,
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

    const { id, name, nickname, image, department, level } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      name: sanitizeInput(name),
    };

    if (nickname !== undefined) updateData.nickname = sanitizeInput(nickname);
    if (image !== undefined) updateData.image = sanitizeInput(image);
    if (department !== undefined) updateData.department = sanitizeInput(department);
    if (level !== undefined) updateData.level = sanitizeInput(level);

    const candidate = await Candidate.findOneAndUpdate(
      { id },
      updateData,
      { new: true, lean: true }
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
        nickname: candidate.nickname,
        image: candidate.image,
        department: candidate.department,
        level: candidate.level,
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