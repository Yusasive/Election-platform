import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Position from '@/models/Position';
import Candidate from '@/models/Candidate';
import { sanitizeInput } from '@/lib/utils';

export async function GET() {
  try {
    await connectDB();

    const positions = await Position.find({ isActive: true })
      .sort({ position: 1 });

    return NextResponse.json({
      success: true,
      positions,
    });
  } catch (error) {
    console.error('Positions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { position, allowMultiple } = await request.json();

    if (!position) {
      return NextResponse.json(
        { error: 'Position name is required' },
        { status: 400 }
      );
    }

    // Check if position already exists
    const existingPosition = await Position.findOne({ position });
    if (existingPosition) {
      return NextResponse.json(
        { error: 'Position already exists' },
        { status: 409 }
      );
    }

    // Create new position
    const newPosition = new Position({
      position: sanitizeInput(position),
      allowMultiple: Boolean(allowMultiple),
    });

    await newPosition.save();

    return NextResponse.json({
      success: true,
      position: {
        id: newPosition._id,
        position: newPosition.position,
        allowMultiple: newPosition.allowMultiple,
      },
    });
  } catch (error) {
    console.error('Position creation error:', error);
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
    const positionName = searchParams.get('position');

    if (!positionName) {
      return NextResponse.json(
        { error: 'Position name is required' },
        { status: 400 }
      );
    }

    // Delete all candidates for this position first
    await Candidate.deleteMany({ position: positionName });

    // Delete the position
    const position = await Position.findOneAndDelete({ position: positionName });

    if (!position) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Position and associated candidates deleted successfully',
    });
  } catch (error) {
    console.error('Position deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}