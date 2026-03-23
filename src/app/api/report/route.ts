import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Task from '@/models/Task';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    await connectToDatabase();

    const stats = await Task.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          doneCount: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } },
          notDoneCount: { $sum: { $cond: [{ $ne: ["$status", "DONE"] }, 1, 0] } },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    if(stats.length === 0) {
      return NextResponse.json({ doneCount: 0, notDoneCount: 0, totalCount: 0 });
    }

    return NextResponse.json(stats[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
