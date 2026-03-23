'use client';
import { useTaskStore, AppTask } from '@/store/useTaskStore';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useState, useMemo, useCallback } from 'react';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';

export default function KanbanBoard() {
  const { tasks, updateTaskStatus } = useTaskStore();
  const [activeTask, setActiveTask] = useState<AppTask | null>(null);
  const [originalStatus, setOriginalStatus] = useState<AppTask['status'] | null>(null);

  const columns = useMemo(() => [
    { id: 'NOT_STARTED', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'DONE', title: 'Done' },
    { id: 'ABANDONED', title: 'Abandoned' }
  ] as const, []);

  const sensors = useSensors(
    useSensor(PointerSensor, useMemo(() => ({
      activationConstraint: {
        distance: 5,
      },
    }), []))
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      const task = event.active.data.current.task;
      setActiveTask(task);
      setOriginalStatus(task.status);
    }
  }, []);

  const onDragOver = useCallback((event: any) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    if (active.data.current?.type !== 'Task') return;

    // Use current tasks from store
    const activeTaskData = tasks.find(t => t._id === activeId);
    if (!activeTaskData) return;

    const overData = over.data.current;
    
    if (overData?.type === 'Column') {
      const newStatus = overId as AppTask['status'];
      if (activeTaskData.status !== newStatus) {
        updateTaskStatus(activeId as string, newStatus);
      }
    } else if (overData?.type === 'Task') {
      const overTaskData = tasks.find(t => t._id === overId);
      if (overTaskData && activeTaskData.status !== overTaskData.status) {
        updateTaskStatus(activeId as string, overTaskData.status);
      }
    }
  }, [tasks, updateTaskStatus]);

  const onDragEnd = useCallback(async (event: DragEndEvent) => {
    const activeId = activeTask?._id;
    // Important: find the task in the LATEST tasks list to get its NEW status
    const currentTask = tasks.find(t => t._id === activeId);
    
    if (currentTask && originalStatus && currentTask.status !== originalStatus) {
      try {
        await fetch(`/api/tasks/${currentTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: currentTask.status })
        });
      } catch (e) {
        console.error('Failed to update task status:', e);
      }
    }
    
    setActiveTask(null);
    setOriginalStatus(null);
  }, [activeTask, tasks, originalStatus]);

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 h-full overflow-x-auto md:overflow-x-hidden md:gap-4">
        {columns.map(col => (
          <div key={col.id} className="shrink-0 w-[260px] md:flex-1 md:w-auto md:min-w-0 h-full">
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
