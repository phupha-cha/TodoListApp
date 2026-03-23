import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Routine from '@/models/Routine';
import Task from '@/models/Task';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    
    const deletedRoutine = await Routine.findByIdAndDelete(id);
    if (!deletedRoutine) return NextResponse.json({ error: 'Routine not found' }, { status: 404 });

    // Delete future tasks for this routine
    const todayStr = new Date().toISOString().split('T')[0];
    await Task.deleteMany({
      routineId: id,
      date: { $gte: todayStr },
      status: 'NOT_STARTED'
    });

    return NextResponse.json({ message: 'Routine deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
