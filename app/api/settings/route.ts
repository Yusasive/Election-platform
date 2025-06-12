import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ElectionSettings from '@/models/ElectionSettings';

export async function GET() {
  try {
    await connectDB();

    let settings = await ElectionSettings.findOne();
    
    if (!settings) {
      // Create default settings
      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(6, 0, 0, 0);
      const endTime = new Date(now);
      endTime.setHours(20, 0, 0, 0);

      settings = new ElectionSettings({
        votingStartTime: startTime,
        votingEndTime: endTime,
        loginDuration: 35,
        isVotingActive: false,
      });
      
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const updateData = await request.json();

    let settings = await ElectionSettings.findOne();
    
    if (!settings) {
      settings = new ElectionSettings(updateData);
    } else {
      Object.assign(settings, updateData);
    }

    await settings.save();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}