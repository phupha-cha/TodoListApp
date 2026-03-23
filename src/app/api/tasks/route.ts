import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Task from '@/models/Task';
import { generateTasksForDate, generateTasksForDateRange } from '@/services/routineService';
import { format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    await connectToDatabase();

    const now = new Date();
    const currentDateStr = format(now, 'yyyy-MM-dd');
    const currentTimeStr = format(now, 'HH:mm');

    const checkAbandoned = (tasksToProcess: any[]) => {
      return tasksToProcess.map((task: any) => {
        const t = task.toObject ? task.toObject() : task;
        if (t.status !== 'DONE' && t.status !== 'ABANDONED' && t.endDate) {
          let isPast = false;
          if (t.endDate < currentDateStr) {
             isPast = true;
          } else if (t.endDate === currentDateStr && t.endTime && t.endTime < currentTimeStr) {
             isPast = true;
          }
          if (isPast) {
            t.status = 'ABANDONED';
            Task.updateOne({ _id: t._id }, { status: 'ABANDONED' }).exec().catch(console.error);
          }
        }
        return t;
      });
    };

    if (start && end) {
      await generateTasksForDateRange(start, end);
      const tasks = await Task.find({ date: { $gte: start, $lte: end } }).sort({ date: 1, time: 1, createdAt: 1 });
      return NextResponse.json(checkAbandoned(tasks));
    } else if (date) {
      await generateTasksForDate(date);
      const tasks = await Task.find({ date }).sort({ time: 1, createdAt: 1 });
      return NextResponse.json(checkAbandoned(tasks));
    } else {
      return NextResponse.json({ error: 'Date parameters required' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectToDatabase();
    const task = new Task(body);
    await task.save();
    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
