import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AppTask } from '@/store/useTaskStore';
import TaskCard from './TaskCard';

interface Props {
  columnId: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' | 'ABANDONED';
  title: string;
  tasks: AppTask[];
}

export default function KanbanColumn({ columnId, title, tasks }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: { type: 'Column', columnId },
  });

  const columnStyles: Record<string, { bar: string; label: string }> = {
    NOT_STARTED: { bar: '#6366f1', label: '#6366f1' },
    IN_PROGRESS:  { bar: '#f59e0b', label: '#f59e0b' },
    DONE:         { bar: '#22c55e', label: '#22c55e' },
    ABANDONED:    { bar: '#94a3b8', label: '#94a3b8' },
  };
  const cs = columnStyles[columnId] || { bar: '#94a3b8', label: '#6b7280' };

  return (
    <div className="flex flex-col bg-secondary-50 dark:bg-bg-panel border border-border-main rounded-2xl overflow-hidden w-full h-full">
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: cs.bar }} />
      <div className="px-4 py-3 border-b border-border-main flex justify-between items-center bg-bg-card shrink-0">
          <div className="flex items-center gap-1.5 font-bold" style={{ color: cs.label }}>
            {title}
          <span className="bg-secondary-100 dark:bg-bg-main text-text-muted text-xs px-2 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
          </div>
      </div>
      
      <div 
        ref={setNodeRef}
        className={`flex-1 p-3 overflow-y-auto flex flex-col gap-3 transition-colors ${
          isOver ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
        }`}
      >
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task._id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
