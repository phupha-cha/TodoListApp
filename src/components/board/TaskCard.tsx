import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AppTask, useTaskStore } from '@/store/useTaskStore';
import { GripVertical, Clock, RepeatIcon, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

export default function TaskCard({ task }: { task: AppTask }) {
  const { setEditingTask } = useTaskStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
  });

  const cardStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(task.bgColor ? { backgroundColor: task.bgColor } : {}),
    ...(task.textColor ? { color: task.textColor } : {}),
  };

  const accentColor = task.bgColor || null;

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} style={cardStyle} 
        className="h-[3px] bg-primary-500 rounded-full my-2 w-full animate-pulse shadow-sm shadow-primary-500/50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef} 
      style={cardStyle}
      {...attributes}
      {...listeners}
      className={`p-4 rounded-xl shadow-premium border ${task.status === 'DONE' ? 'border-[#22c55e50] opacity-80' : 'border-border-main'} ${!task.bgColor ? 'bg-bg-card' : ''} hover:border-primary-400 dark:hover:border-primary-500 transition-colors group flex flex-col gap-2 relative cursor-grab active:cursor-grabbing overflow-hidden`}
    >
      {accentColor && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: accentColor, filter: 'brightness(0.7)' }} />}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-1 font-semibold text-text-main">
          {task.taskName} 
          {task.isRoutine && <span title="Routine Task"><RepeatIcon size={14} className="text-primary-500 ml-1" /></span>}
        </div>
        
        <button 
          type="button"
          onPointerDown={(e) => { e.stopPropagation(); }}
          onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
          className="text-text-muted hover:text-primary-600 transition p-1 bg-secondary-50 dark:bg-bg-main rounded-md opacity-0 group-hover:opacity-100"
          title="Edit Task"
        >
          <Edit2 size={14} />
        </button>
      </div>
      
      {task.description && (
        <p className="text-xs text-text-muted line-clamp-2 mt-1">{task.description}</p>
      )}

      <div className="flex justify-between items-center mt-2">
         {(task.time || task.endTime) ? (
           <div className="flex items-center gap-1 text-[11px] font-medium bg-secondary-100 dark:bg-bg-main px-2 py-1 rounded text-text-muted">
             <Clock size={12} className="text-primary-500" /> 
             <span>
               {task.time || '--:--'}
               {(task.endDate || task.endTime) && (
                 <> - {task.endDate && task.endDate !== task.date ? `${format(new Date(task.endDate), 'dd/MM')} ` : ''}{task.endTime || '--:--'}</>
               )}
             </span>
           </div>
         ) : <div/>}
         
         <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
            task.status === 'DONE' ? 'bg-[#22c55e]' :
            task.status === 'IN_PROGRESS' ? 'bg-[#3b82f6]' :
            'bg-[#94a3b8] dark:bg-border-main'
         }`} title={task.status.replace('_', ' ')} />
      </div>
    </div>
  );
}
