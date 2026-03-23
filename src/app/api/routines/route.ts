import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Routine from '@/models/Routine';
import { checkRoutineConflict, createRoutine } from '@/services/routineService';

export async function GET() {
  try {
    await connectToDatabase();
    const routines = await Routine.find({}).sort({ createdAt: -1 });
    return NextResponse.json(routines);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pattern, daysOfWeek, time, resolution = 'NONE' } = body;
    
    // First, check for conflict if resolution is not provided
    if (resolution === 'NONE') {
      const hasConflict = await checkRoutineConflict(pattern, daysOfWeek || [], time);
      if (hasConflict) {
        return NextResponse.json(
          { 
            error: 'Conflict detected', 
            conflict: true, 
            message: 'A routine already exists at this time. Should we REPLACE or MERGE?' 
          }, 
          { status: 409 }
        );
      }
    }

    const newRoutine = await createRoutine(body, resolution);
    return NextResponse.json(newRoutine, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
