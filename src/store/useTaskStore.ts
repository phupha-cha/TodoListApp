import { create } from 'zustand';

export interface AppTask {
  _id: string;
  taskName: string;
  date: string;
  time?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  description?: string;
  bgColor?: string;
  textColor?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' | 'ABANDONED';
  isRoutine: boolean;
  routineId?: string;
}

interface TaskState {
  tasks: AppTask[];
  tasksLoading: boolean;
  selectedDate: string;
  viewMode: 'daily' | 'weekly' | 'monthly';
  refreshCounter: number;
  editingTask: AppTask | null;
  setTasks: (tasks: AppTask[]) => void;
  setTasksLoading: (loading: boolean) => void;
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: 'daily' | 'weekly' | 'monthly') => void;
  setEditingTask: (task: AppTask | null) => void;
  triggerRefresh: () => void;
  updateTaskStatus: (taskId: string, status: AppTask['status']) => void;
  addTask: (task: AppTask) => void;
  removeTask: (taskId: string) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  tasksLoading: false,
  selectedDate: new Date().toISOString().split('T')[0],
  viewMode: 'daily',
  refreshCounter: 0,
  editingTask: null,
  setTasks: (tasks) => set({ tasks }),
  setTasksLoading: (loading) => set({ tasksLoading: loading }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setEditingTask: (task) => set({ editingTask: task }),
  triggerRefresh: () => set((state) => ({ refreshCounter: state.refreshCounter + 1 })),
  updateTaskStatus: (taskId, status) => set((state) => ({
    tasks: state.tasks.map(t => t._id === taskId ? { ...t, status } : t)
  })),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  removeTask: (taskId) => set((state) => ({ tasks: state.tasks.filter(t => t._id !== taskId) }))
}));
