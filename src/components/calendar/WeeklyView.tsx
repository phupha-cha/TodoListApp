'use client';
import { useTaskStore, AppTask } from '@/store/useTaskStore';
import { format, addDays, startOfWeek, isSameDay, differenceInDays } from 'date-fns';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import { useState } from 'react';

// Draggable Task Block
function WeeklyTaskBlock({ task, topOffset, blockHeight }: { task: AppTask, topOffset: number, blockHeight: number }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: task._id,
    data: { type: 'WeeklyTask', task }
  });

  const timeLabel = task.endTime ? `${task.time} – ${task.endTime}` : task.time;
  const hasCustomColor = !!task.bgColor;
  const blockStyle: React.CSSProperties = hasCustomColor
    ? {
        top: `${topOffset}px`, height: `${blockHeight}px`, minHeight: '22px',
        backgroundColor: task.bgColor,
        color: task.textColor || '#1e293b',
        borderColor: task.bgColor,
        opacity: 0.92
      }
    : { top: `${topOffset}px`, height: `${blockHeight}px`, minHeight: '22px' };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute left-1 right-1 p-1.5 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing overflow-hidden transition-all hover:z-10 hover:shadow-md ${!hasCustomColor ? (task.status === 'DONE' ? 'bg-[#22c55e20] border-status-done text-status-done opacity-60' : 'bg-primary-100 dark:bg-primary-600/60 border-primary-300 dark:border-primary-500 text-primary-800 dark:text-white') : ''} ${isDragging ? 'opacity-30' : ''}`}
      style={blockStyle}
      title={task.taskName}
    >
      <div className="text-[10px] font-bold leading-tight truncate">{task.taskName}</div>
      {blockHeight > 28 && <div className="text-[8px] opacity-80 leading-none truncate mt-0.5">{timeLabel}</div>}
    </div>
  );
}

// Droppable Day Column
function WeeklyDayColumn({ day, hours, children, isToday }: any) {
  const dateStr = format(day, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({ id: dateStr, data: { type: 'WeeklyDay' } });
  
  return (
    <div ref={setNodeRef} className={`col-span-1 border-r border-border-main relative transition-colors ${isOver ? 'bg-primary-50/50 dark:bg-primary-900/30' : 'bg-bg-card'}`}>
      {hours.map((h: number) => <div key={h} className="h-[40px] border-b border-border-main/50" />)}
      {children}
    </div>
  );
}


export default function WeeklyView() {
  const { tasks, selectedDate, setTasks, triggerRefresh } = useTaskStore();
  const [activeTask, setActiveTask] = useState<AppTask | null>(null);

  const start = startOfWeek(new Date(selectedDate));
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  const hours = Array.from({ length: 24 }).map((_, i) => i);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const onDragStart = (e: any) => {
    if(e.active.data.current?.task) {
      setActiveTask(e.active.data.current.task);
    }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over, delta } = e;
    if (!over) return;
    
    const newDateStr = over.id as string;
    const taskData = active.data.current?.task as AppTask;
    
    if (!taskData) return;

    const dateChanged = taskData.date !== newDateStr;
    
    // Calculate time shift from vertical drag (40px = 1 hour)
    const deltaMinutes = Math.round((delta.y / 40) * 60);
    const hasTimeDelta = Math.abs(deltaMinutes) >= 5; // ignore tiny drags

    const computeNewTime = (originalTime: string, offsetMinutes: number) => {
      const [h, m] = originalTime.split(':').map(Number);
      let totalMins = h * 60 + m + offsetMinutes;
      totalMins = Math.max(0, Math.min(totalMins, 23 * 60 + 59));
      const nh = Math.floor(totalMins / 60);
      const nm = totalMins % 60;
      return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
    };

    if (dateChanged || hasTimeDelta) {
      const diffDays = dateChanged ? differenceInDays(new Date(newDateStr), new Date(taskData.date)) : 0;
      const updatedFields: any = {};

      if (dateChanged) updatedFields.date = newDateStr;

      if (hasTimeDelta && taskData.time) {
        updatedFields.time = computeNewTime(taskData.time, deltaMinutes);
        if (taskData.endTime) {
          updatedFields.endTime = computeNewTime(taskData.endTime, deltaMinutes);
        }
      }

      if (dateChanged && taskData.endDate) {
        updatedFields.endDate = format(addDays(new Date(taskData.endDate), diffDays), 'yyyy-MM-dd');
      }

      // Optimistic update
      setTasks(tasks.map(t => t._id === taskData._id ? { ...t, ...updatedFields } : t));
      
      try {
        const res = await fetch(`/api/tasks/${taskData._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields)
        });
        if (!res.ok) { triggerRefresh(); }
      } catch(e) { console.error(e); triggerRefresh(); }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex flex-col h-full bg-bg-card rounded-2xl border border-border-main overflow-hidden shadow-premium animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="grid grid-cols-8 border-b border-border-main bg-secondary-50 dark:bg-bg-panel shrink-0">
          <div className="p-3 border-r border-border-main flex items-center justify-center text-xs font-bold text-text-muted uppercase">Time</div>
          {days.map(day => {
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={`p-3 border-r border-border-main flex flex-col items-center justify-center ${isToday ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                <span className="text-xs font-bold text-text-muted uppercase">{format(day, 'EEE')}</span>
                <span className={`text-lg font-extrabold ${isToday ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/50 w-8 h-8 flex items-center justify-center rounded-full mt-1' : 'text-text-main mt-1'}`}>
                  {format(day, 'd')}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="grid grid-cols-8 relative" style={{ height: '960px' }}> {/* 40px per hour */}
            
            {/* Time Column */}
            <div className="col-span-1 border-r border-border-main flex flex-col">
              {hours.map(hour => (
                <div key={hour} className="h-[40px] border-b border-border-main flex items-center justify-center relative bg-bg-panel/10">
                  <span className="text-[10px] text-text-muted font-medium absolute -top-2.5 bg-bg-card px-1">{hour}:00</span>
                </div>
              ))}
            </div>
            
            {/* Day Columns */}
            {days.map((day, dayIdx) => {
              const dayTasks = tasks.filter(t => t.date === format(day, 'yyyy-MM-dd') && t.time);
              const isToday = isSameDay(day, new Date());
              return (
                <WeeklyDayColumn key={dayIdx} day={day} hours={hours} isToday={isToday}>
                  {dayTasks.map(task => {
                    const [h, m] = task.time!.split(':').map(Number);
                    const topOffset = (h + m / 60) * 40;
                    let blockHeight = 38;
                    if (task.endTime) {
                      const [eh, em] = task.endTime.split(':').map(Number);
                      const durationMinutes = (eh * 60 + em) - (h * 60 + m);
                      if (durationMinutes > 0) {
                        blockHeight = Math.max(22, (durationMinutes / 60) * 40);
                      }
                    }
                    return <WeeklyTaskBlock key={task._id} task={task} topOffset={topOffset} blockHeight={blockHeight} />;
                  })}
                </WeeklyDayColumn>
              );
            })}
          </div>
        </div>

        {/* Drag Overlay for Visual Feedback */}
        <DragOverlay>
           {activeTask ? (
             <div className={`p-1.5 rounded-lg border shadow-xl bg-primary-200 dark:bg-primary-800 border-primary-500 text-primary-900 dark:text-white opacity-80`} style={{ height: '38px', width: '100px' }}>
                <div className="text-[10px] font-bold leading-tight truncate">{activeTask.taskName}</div>
                <div className="text-[8px] opacity-80 leading-none truncate mt-0.5">{activeTask.time}</div>
             </div>
           ) : null}
        </DragOverlay>

      </div>
    </DndContext>
  );
}
