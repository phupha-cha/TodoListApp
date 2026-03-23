import Task from '@/models/Task';
import Routine, { IRoutine } from '@/models/Routine';
import { connectToDatabase } from '@/lib/db';
import { parseISO, isBefore, isAfter, startOfDay, getDay, eachDayOfInterval, format } from 'date-fns';

/**
 * Checks if a routine should run on a specific date based on its pattern.
 */
function shouldGenerateForDate(routine: IRoutine, checkDateStr: string): boolean {
  const checkDate = parseISO(checkDateStr);
  const checkDateStart = startOfDay(checkDate);
  const routineStart = startOfDay(new Date(routine.startDate));
  const routineEnd = routine.endDate ? startOfDay(new Date(routine.endDate)) : null;

  if (isBefore(checkDateStart, routineStart)) return false;
  if (routineEnd && isAfter(checkDateStart, routineEnd)) return false;

  if (routine.pattern === 'DAILY') {
    return true;
  }

  if (routine.pattern === 'WEEKLY') {
    // date-fns getDay returns 0-6 where 0 is Sunday
    const dayOfWeek = getDay(checkDate); 
    if (routine.daysOfWeek && routine.daysOfWeek.includes(dayOfWeek)) {
      return true;
    }
  }

  return false;
}

/**
 * Lazy generates tasks for a given date from active routines.
 * Uses findOneAndUpdate with upsert: true to ensure idempotency.
 */
export async function generateTasksForDate(dateStr: string) {
  await connectToDatabase();
  
  // Find all routines that are active on or before this date
  const targetDate = parseISO(dateStr);
  const routines = await Routine.find({
    startDate: { $lte: targetDate },
    $or: [{ endDate: null }, { endDate: { $gte: targetDate } }]
  });

  const generatePromises = routines
    .filter((routine) => shouldGenerateForDate(routine, dateStr))
    .map(async (routine) => {
      const { taskTemplate, time, _id } = routine;
      
      const query = {
        taskName: taskTemplate.taskName,
        date: dateStr,
        time: time || '00:00',
        routineId: _id,
      };

      const update = {
        $setOnInsert: {
          location: taskTemplate.location,
          description: taskTemplate.description,
          status: 'NOT_STARTED',
          isRoutine: true,
        }
      };

      // Upsert: Only inserts if not exists.
      return Task.findOneAndUpdate(query, update, { upsert: true, new: true, setDefaultsOnInsert: true });
    });

  await Promise.all(generatePromises);
}

/**
 * Check for scheduling conflicts with existing routines.
 * Returns true if conflict exists.
 */
export async function checkRoutineConflict(pattern: string, daysOfWeek: number[], time: string): Promise<boolean> {
  await connectToDatabase();
  const query: any = { time };
  
  if (pattern === 'DAILY') {
    // A new daily routine conflicts with any routine at the same time
    const existing = await Routine.exists(query);
    return !!existing;
  } else if (pattern === 'WEEKLY' && daysOfWeek?.length > 0) {
    // Check if any existing routine hits the same days and time
    query.$or = [
      { pattern: 'DAILY' },
      { pattern: 'WEEKLY', daysOfWeek: { $in: daysOfWeek } }
    ];
    const existing = await Routine.exists(query);
    return !!existing;
  }
  return false;
}

/**
 * Handle creation of a routine with conflict resolution strategy.
 */
export async function createRoutine(routineData: any, resolution: 'REPLACE' | 'MERGE' | 'NONE') {
  await connectToDatabase();

  if (resolution === 'REPLACE') {
    // Find conflicting routines
    const query: any = { time: routineData.time };
    if (routineData.pattern === 'WEEKLY' && routineData.daysOfWeek) {
      query.$or = [
        { pattern: 'DAILY' },
        { pattern: 'WEEKLY', daysOfWeek: { $in: routineData.daysOfWeek } }
      ];
    }
    
    const conflictingRoutines = await Routine.find(query);
    const routineIds = conflictingRoutines.map(r => r._id);

    // Delete existing conflicting routines
    await Routine.deleteMany({ _id: { $in: routineIds } });
    
    // Delete their upcoming tasks that are untouched
    // Note: In MVP, we can delete their future tasks 
    const todayStr = new Date().toISOString().split('T')[0];
    await Task.deleteMany({
      routineId: { $in: routineIds },
      date: { $gte: todayStr }
    });
  }

  // Create new routine
  const routine = new Routine(routineData);
  await routine.save();
  return routine;
}

/**
 * Lazy generates tasks for a range of dates.
 */
export async function generateTasksForDateRange(startDateStr: string, endDateStr: string) {
  await connectToDatabase();
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);
  const days = eachDayOfInterval({ start, end });

  const routines = await Routine.find({
    startDate: { $lte: end },
    $or: [{ endDate: null }, { endDate: { $gte: start } }]
  });

  const generatePromises: Promise<any>[] = [];

  for (const day of days) {
    const dateStr = format(day, 'yyyy-MM-dd');
    
    routines
      .filter((routine) => shouldGenerateForDate(routine, dateStr))
      .forEach((routine) => {
        const { taskTemplate, time, _id } = routine;
        
        const query = {
          taskName: taskTemplate.taskName,
          date: dateStr,
          time: time || '00:00',
          routineId: _id,
        };

        const update = {
          $setOnInsert: {
            location: taskTemplate.location,
            description: taskTemplate.description,
            status: 'NOT_STARTED',
            isRoutine: true,
          }
        };

        generatePromises.push(
          Task.findOneAndUpdate(query, update, { upsert: true, new: true, setDefaultsOnInsert: true })
        );
      });
  }

  await Promise.all(generatePromises);
}
