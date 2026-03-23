'use client';
import { useTaskStore, AppTask } from '@/store/useTaskStore';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useState } from 'react';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';

export default function KanbanBoard() {
  const { tasks, updateTaskStatus } = useTaskStore();
  const [activeTask, setActiveTask] = useState<AppTask | null>(null);
  const [originalStatus, setOriginalStatus] = useState<AppTask['status'] | null>(null);

  const columns = [
    { id: 'NOT_STARTED', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'DONE', title: 'Done' },
    { id: 'ABANDONED', title: 'Abandoned' }
  ] as const;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      const task = event.active.data.current.task;
      setActiveTask(task);
      setOriginalStatus(task.status);
    }
  };

  const onDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const activeTaskData = tasks.find(t => t._id === activeId);
    
    if (!isActiveTask || !activeTaskData) return;

    const isOverColumn = over.data.current?.type === 'Column';
    const isOverTask = over.data.current?.type === 'Task';

    if (isOverColumn) {
      if (activeTaskData.status !== overId) {
        updateTaskStatus(activeId as string, overId as AppTask['status']);
      }
    } else if (isOverTask) {
      const overTaskData = tasks.find(t => t._id === overId);
      if (overTaskData && activeTaskData.status !== overTaskData.status) {
        updateTaskStatus(activeId as string, overTaskData.status);
      }
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const activeTaskObj = tasks.find(t => t._id === activeId);

    // Only update DB if the status actually changed natively or optimistically
    if (activeTaskObj && originalStatus && activeTaskObj.status !== originalStatus) {
      try {
        await fetch(`/api/tasks/${activeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: activeTaskObj.status })
        });
      } catch (e) {
        console.error('Failed to update task status:', e);
      }
    }
    setOriginalStatus(null);
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 h-full overflow-x-auto md:overflow-x-hidden md:gap-4">
        {columns.map(col => (
          <div key={col.id} className="flex-shrink-0 w-[260px] md:flex-1 md:w-auto md:min-w-0 h-full">
            <KanbanColumn 
              columnId={col.id} 
              title={col.title} 
              tasks={tasks.filter(t => t.status === col.id)} 
            />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  );
}
