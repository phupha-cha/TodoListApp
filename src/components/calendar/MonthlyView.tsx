'use client';
import { useTaskStore, AppTask } from '@/store/useTaskStore';
import { format, startOfWeek, startOfMonth, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, differenceInDays, addDays, subMonths, addMonths } from 'date-fns';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function MonthlyDraggableTask({ task }: { task: AppTask }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: task._id,
    data: { type: 'MonthlyTask', task }
  });

  const hasCustomColor = !!task.bgColor;
  const chipStyle: React.CSSProperties = hasCustomColor
    ? { backgroundColor: task.bgColor, color: task.textColor || '#1e293b', borderColor: task.bgColor }
    : {};

  return (
    <div 
       ref={setNodeRef} {...attributes} {...listeners} 
       onClick={(e) => { e.stopPropagation(); useTaskStore.getState().setEditingTask(task); }}
       className={`text-[9.5px] font-semibold px-1.5 py-1 rounded truncate cursor-grab active:cursor-grabbing transition hover:brightness-95 border ${hasCustomColor ? '' : task.status === 'DONE' ? 'bg-[#22c55e20] border-status-done text-status-done' : 'bg-primary-200/60 dark:bg-primary-500/25 border-primary-300 dark:border-primary-600/40 text-primary-900 dark:text-primary-200'} ${isDragging ? 'opacity-30' : ''}`} 
       style={chipStyle}
       title={task.taskName}
    >
      {task.time ? <span className="hidden md:inline opacity-70 mr-1">{task.time}</span> : ''}
      {task.taskName}
    </div>
  );
}

function MonthlyDayBox({ day, isCurrentMonth, isToday, dayTasks }: any) {
  const dateStr = format(day, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({ id: dateStr, data: { type: 'MonthlyDay' } });
  
  return (
    <div ref={setNodeRef} className={`border-r border-b border-border-main p-1 md:p-1.5 flex flex-col gap-0.5 md:gap-1 overflow-hidden transition min-h-0 ${isOver ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 inset-shadow-sm' : (!isCurrentMonth ? 'bg-secondary-50/50 dark:bg-bg-panel/50 opacity-50' : 'bg-bg-card hover:bg-secondary-50 dark:hover:bg-primary-900/10')}`}>
      <div className="flex items-center gap-1 px-0.5 mb-0.5">
        <span className={`text-[10px] font-bold leading-none ${isToday ? 'bg-primary-500 text-white w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full' : 'text-text-muted'}`}>
          {format(day, 'd')}
        </span>
        {dayTasks.length > 0 && <span className="text-[8px] font-medium text-primary-500 leading-none">{dayTasks.length}</span>}
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col gap-0.5">
        {dayTasks.slice(0, 3).map((task: AppTask) => (
          <MonthlyDraggableTask key={task._id} task={task} />
        ))}
        {dayTasks.length > 3 && (
          <span className="text-[8px] text-text-muted font-medium px-1">+{dayTasks.length - 3} more</span>
        )}
      </div>
    </div>
  );
}


export default function MonthlyView() {
  const { tasks, setTasks, triggerRefresh, selectedDate } = useTaskStore();
  const [activeTask, setActiveTask] = useState<AppTask | null>(null);
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate));
  const [monthTasks, setMonthTasks] = useState<AppTask[]>([]);

  const start = startOfWeek(startOfMonth(viewMonth));
  const end = endOfWeek(endOfMonth(viewMonth));
  const days = eachDayOfInterval({ start, end });
  const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Fetch tasks for the viewed month range
  useEffect(() => {
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    fetch(`/api/tasks?start=${startStr}&end=${endStr}`)
      .then(r => r.json())
      .then(data => setMonthTasks(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [viewMonth]);

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
    const { active, over } = e;
    if (!over) return;
    
    const newDateStr = over.id as string;
    const taskData = active.data.current?.task as AppTask;
    
    if (taskData && taskData.date !== newDateStr) {
      const diffDays = differenceInDays(new Date(newDateStr), new Date(taskData.date));
      let updatedFields: any = { date: newDateStr };
      
      if (taskData.endDate) {
        updatedFields.endDate = format(addDays(new Date(taskData.endDate), diffDays), 'yyyy-MM-dd');
      }

      // Optimistic update
      setTasks(tasks.map(t => t._id === taskData._id ? { ...t, ...updatedFields } : t));
      
      // Persist to DB
      try {
        const res = await fetch(`/api/tasks/${taskData._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields)
        });
        if(!res.ok) { triggerRefresh(); } 
      } catch(e) { console.error(e); triggerRefresh(); }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex flex-col h-full bg-bg-card rounded-2xl border border-border-main overflow-hidden shadow-premium animate-in fade-in duration-300">
        
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-main bg-secondary-50 dark:bg-bg-panel shrink-0">
          <button onClick={() => setViewMonth(subMonths(viewMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-secondary-200 dark:hover:bg-bg-card transition text-text-muted hover:text-primary-500">
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-text-main">{format(viewMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => setViewMonth(new Date())}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 hover:bg-primary-200 transition">
              Today
            </button>
          </div>
          <button onClick={() => setViewMonth(addMonths(viewMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-secondary-200 dark:hover:bg-bg-card transition text-text-muted hover:text-primary-500">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-border-main bg-secondary-50 dark:bg-bg-panel shrink-0">
          {WEEK_DAYS.map(day => (
            <div key={day} className="p-3 border-r border-border-main text-center text-xs font-bold text-text-muted uppercase">
              {day}
            </div>
          ))}
        </div>
        
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-hidden bg-border-main/20 gap-px">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, viewMonth);
            const isToday = isSameDay(day, new Date());
            const dayTasks = monthTasks.filter(t => t.date === format(day, 'yyyy-MM-dd'));
            
            return (
              <MonthlyDayBox key={day.toISOString()} day={day} isCurrentMonth={isCurrentMonth} isToday={isToday} dayTasks={dayTasks} />
            );
          })}
        </div>
        
        <DragOverlay>
           {activeTask ? (
             <div className="text-[9.5px] font-semibold px-2 py-1.5 rounded bg-primary-200 dark:bg-primary-800 border-primary-500 text-primary-900 dark:text-white shadow-xl rotate-3 opacity-90 scale-105">
               {activeTask.time ? <span className="opacity-70 mr-1">{activeTask.time}</span> : ''}
               {activeTask.taskName}
             </div>
           ) : null}
        </DragOverlay>

      </div>
    </DndContext>
  );
}
