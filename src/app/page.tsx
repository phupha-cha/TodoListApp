'use client';
import KanbanBoard from '@/components/board/KanbanBoard';
import MonthlyView from '@/components/calendar/MonthlyView';
import WeeklyView from '@/components/calendar/WeeklyView';
import LeftPanel from '@/components/layout/LeftPanel';
import ThemeToggle from '@/components/layout/ThemeToggle';
import EditTaskModal from '@/components/modals/EditTaskModal';
import ReportModal from '@/components/modals/ReportModal';
import TaskModal from '@/components/modals/TaskModal';
import { useTaskStore } from '@/store/useTaskStore';
import { format } from 'date-fns';
import { BarChart2, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const { selectedDate, tasks, setTasks, setTasksLoading, viewMode, editingTask, setEditingTask, refreshCounter, updateTaskStatus, setViewMode } = useTaskStore();
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const tasksRef = useRef(tasks);
  
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  useEffect(() => {
    setMounted(true);
    const intervalId = setInterval(() => {
      const now = new Date();
      const currentDateStr = format(now, 'yyyy-MM-dd');
      const currentTimeStr = format(now, 'HH:mm');
      tasksRef.current.forEach(t => {
        if (t.status !== 'DONE' && t.status !== 'ABANDONED' && t.endDate) {
          let isPast = t.endDate < currentDateStr || (t.endDate === currentDateStr && !!t.endTime && t.endTime < currentTimeStr);
          if (isPast) {
            updateTaskStatus(t._id, 'ABANDONED');
            fetch(`/api/tasks/${t._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ABANDONED' }) }).catch(console.error);
          }
        }
      });
    }, 10000);
    return () => clearInterval(intervalId);
  }, [updateTaskStatus]);

  useEffect(() => {
    const fetchTasks = async () => {
      setTasksLoading(true);
      try {
        let url = `/api/tasks?date=${selectedDate}`;
        if (viewMode === 'weekly') {
          const s = new Date(selectedDate); s.setDate(s.getDate() - s.getDay());
          const e = new Date(s); e.setDate(e.getDate() + 6);
          url = `/api/tasks?start=${s.toISOString().split('T')[0]}&end=${e.toISOString().split('T')[0]}`;
        } else if (viewMode === 'monthly') {
          const s = new Date(selectedDate); s.setDate(1);
          const e = new Date(s.getFullYear(), s.getMonth() + 1, 0);
          url = `/api/tasks?start=${s.toISOString().split('T')[0]}&end=${e.toISOString().split('T')[0]}`;
        }
        const res = await fetch(url);
        if (res.ok) setTasks(await res.json());
      } catch (err) { console.error(err); }
      finally { setTasksLoading(false); }
    };
    fetchTasks();
  }, [selectedDate, viewMode, refreshCounter, setTasks, setTasksLoading]);

  if (!mounted) return <div className="flex flex-col md:flex-row h-dvh overflow-hidden bg-bg-main" />;

  return (
    <div className="flex flex-col md:flex-row h-dvh overflow-hidden bg-bg-main">

      {/* ===== DESKTOP: Left Sidebar ===== */}
      <div className="hidden md:flex w-[320px] lg:w-[350px] shrink-0 h-full z-10 shadow-premium">
        <LeftPanel />
      </div>

      {/* ===== Main Content ===== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="shrink-0 h-14 md:h-[84px] border-b border-border-main flex items-center gap-3 px-4 md:px-6 bg-bg-panel/70 backdrop-blur-md z-10">
          {/* Mobile: tapping shows daily drawer */}
          <button className="md:hidden flex flex-col text-left" onClick={() => setMobileDrawerOpen(true)}>
            <span className="text-[10px] text-text-muted font-medium leading-none">{format(new Date(selectedDate), 'EEEE')}</span>
            <span className="text-sm font-bold text-primary-500 leading-tight">{format(new Date(selectedDate), 'MMM d, yyyy')}</span>
          </button>
          <h1 className="hidden md:block text-2xl font-bold text-text-main tracking-tight">Task Lists</h1>

          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            <button onClick={() => setReportModalOpen(true)} className="p-2 text-text-muted hover:text-primary-500 hover:bg-secondary-100 dark:hover:bg-bg-card rounded-xl transition" title="Report">
              <BarChart2 size={18} />
            </button>
            <ThemeToggle />
            <button onClick={() => setTaskModalOpen(true)} className="btn-premium px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-medium flex items-center gap-1.5 shadow-premium border border-primary-600/20 text-sm">
              <Plus size={16} /> <span className="hidden sm:inline">New Item</span>
            </button>
          </div>
        </header>

        {/* Mobile: View Tabs */}
        <div className="flex md:hidden border-b border-border-main bg-bg-panel shrink-0">
          {(['daily', 'weekly', 'monthly'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wide transition ${viewMode === v ? 'text-primary-500 border-b-2 border-primary-500' : 'text-text-muted'}`}>
              {v}
            </button>
          ))}
        </div>

        {/* Main View */}
        <main className="flex-1 overflow-hidden p-2 md:p-6 bg-dots relative flex flex-col">
          {viewMode === 'daily'   && <KanbanBoard />}
          {viewMode === 'weekly'  && <WeeklyView />}
          {viewMode === 'monthly' && <MonthlyView />}
        </main>
      </div>

      {/* ===== MOBILE: Daily Tasks Slide-up Drawer ===== */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setMobileDrawerOpen(false)} />
          <div className="relative bg-bg-panel rounded-t-2xl shadow-2xl border-t border-border-main max-h-[85dvh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-main shrink-0">
              <h2 className="font-bold text-text-main">{format(new Date(selectedDate), 'EEEE, MMM d')}</h2>
              <button onClick={() => setMobileDrawerOpen(false)} className="text-text-muted hover:text-text-main p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-bg-card transition text-lg leading-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <LeftPanel />
            </div>
          </div>
        </div>
      )}

      {isTaskModalOpen && <TaskModal onClose={() => setTaskModalOpen(false)} />}
      {editingTask && <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
      {isReportModalOpen && <ReportModal onClose={() => setReportModalOpen(false)} />}

      <style dangerouslySetInnerHTML={{__html: `
        .bg-dots { background-image: radial-gradient(var(--color-border-main) 1.5px, transparent 1.5px); background-size: 32px 32px; }
      `}}/>
    </div>
  );
}
