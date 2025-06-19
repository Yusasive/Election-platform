import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sanitizeInput, validateMatricNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { matricNumber, fullName, department, image } = await request.json();

    // Validate required fields
    if (!matricNumber || !fullName || !department) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate matric number format
    if (!validateMatricNumber(matricNumber)) {
      return NextResponse.json(
        { error: 'Invalid matric number format' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      matricNumber: sanitizeInput(matricNumber.toLowerCase()),
      fullName: sanitizeInput(fullName),
      department: sanitizeInput(department),
      image: image ? sanitizeInput(image) : '',
    };

    // Check if user already exists
    const existingUser = await User.findOne({ 
      matricNumber: sanitizedData.matricNumber 
    }).lean();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this matric number already exists' },
        { status: 409 }
      );
    }

    // Create new user with explicit field mapping
    const userData = {
      matricNumber: sanitizedData.matricNumber,
      fullName: sanitizedData.fullName,
      department: sanitizedData.department,
      image: sanitizedData.image,
      hasVoted: false,
    };

    const user = new User(userData);
    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        matricNumber: user.matricNumber,
        fullName: user.fullName,
        department: user.department,
        hasVoted: user.hasVoted,
      },
    });
  } catch (error: any) {
    console.error('User creation error:', error);
    
    // Handle specific MongoDB duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern?.matricNumber) {
        return NextResponse.json(
          { error: 'A user with this matric number already exists' },
          { status: 409 }
        );
      } else if (error.keyPattern?.email) {
        // This shouldn't happen with our current schema, but handle it gracefully
        return NextResponse.json(
          { error: 'Database schema conflict detected. Please contact administrator.' },
          { status: 500 }
        );
      } else {
        return NextResponse.json(
          { error: 'Duplicate entry detected' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const matricNumber = searchParams.get('matricNumber');

    if (matricNumber) {
      const user = await User.findOne({ 
        matricNumber: matricNumber.toLowerCase() 
      }).lean();
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user._id,
          matricNumber: user.matricNumber,
          fullName: user.fullName,
          department: user.department,
          hasVoted: user.hasVoted,
        },
      });
    }

    // Get all users (admin only)
    const users = await User.find({})
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}