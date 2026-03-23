import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Task from '@/models/Task';
import { createEvents, EventAttributes } from 'ics';
import { parseISO, getYear, getMonth, getDate, getHours, getMinutes } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const id = searchParams.get('id');

    if (!date && !id) {
      return NextResponse.json({ error: 'Task ID or Date parameter is required' }, { status: 400 });
    }

    await connectToDatabase();
    
    let query: any = {};
    if (id) {
      query._id = id;
    } else if (date) {
      query.date = date;
    }

    const tasks = await Task.find(query);

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ error: 'No tasks found' }, { status: 404 });
    }

    const events: EventAttributes[] = tasks.map((task: any) => {
      const parsedDate = parseISO(task.date);
      const year = getYear(parsedDate);
      const month = getMonth(parsedDate) + 1; // ics months are 1-12
      const day = getDate(parsedDate);
      
      let start: [number, number, number, number, number] = [year, month, day, 0, 0];
      let end: [number, number, number, number, number] = [year, month, day, 1, 0];

      if (task.time) {
        const [hours, mins] = task.time.split(':').map(Number);
        start = [year, month, day, hours, mins];
        end = [year, month, day, hours + 1, mins]; // fixed 1 hr duration
      }

      return {
        title: task.taskName,
        start,
        end,
        location: task.location || undefined,
        description: task.description || undefined,
        status: 'CONFIRMED'
      };
    });

    return new Promise<NextResponse>((resolve) => {
      createEvents(events, (error, value) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
          return;
        }

        const headers = new Headers();
        headers.set('Content-Type', 'text/calendar');
        headers.set('Content-Disposition', `attachment; filename="event_items.ics"`);
        
        resolve(new NextResponse(value, { headers }));
      });
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
