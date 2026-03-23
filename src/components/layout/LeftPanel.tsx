'use client';
import { useTaskStore } from '@/store/useTaskStore';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Download, RepeatIcon } from 'lucide-react';
import { useState } from 'react';

export default function LeftPanel() {
  const { tasks, tasksLoading, selectedDate, setSelectedDate, viewMode, setViewMode } = useTaskStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dailyTasks = tasks.filter(t => t.date === selectedDate);
  
  const handleExportCal = () => {
    window.location.href = `/api/calendar?date=${selectedDate}`;
  };

  const shiftDate = (days: number) => {
    const newDate = addDays(new Date(selectedDate), days);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  return (
    <div className="flex flex-col w-full h-full bg-bg-panel border-r border-border-main p-6 overflow-hidden">
      <div className="flex flex-col mb-6 gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={() => shiftDate(-1)} className="p-1 hover:bg-secondary-200 dark:hover:bg-bg-card rounded">{'<'}</button>
            <div className="relative">
              <div onClick={() => setDropdownOpen(!dropdownOpen)} className="text-center cursor-pointer flex items-center justify-center gap-2 group hover:bg-secondary-100 dark:hover:bg-bg-panel px-3 py-1.5 rounded-xl transition">
                 <CalendarIcon size={16} className="text-primary-500" />
                 <span className="font-semibold text-text-main">{format(new Date(selectedDate), 'MMM d')}</span>
              </div>
              
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute top-full mt-2 left-0 w-48 bg-bg-card rounded-xl shadow-2xl border border-border-main z-50 overflow-hidden flex flex-col py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button onClick={() => { setViewMode('daily'); setDropdownOpen(false); }} className={`px-4 py-2.5 text-left text-sm font-semibold hover:bg-secondary-50 dark:hover:bg-bg-panel transition flex items-center gap-2 ${viewMode === 'daily' ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-text-main'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${viewMode === 'daily' ? 'bg-primary-500' : 'bg-transparent'}`} />
                      Daily View
                    </button>
                    <button onClick={() => { setViewMode('weekly'); setDropdownOpen(false); }} className={`px-4 py-2.5 text-left text-sm font-semibold hover:bg-secondary-50 dark:hover:bg-bg-panel transition flex items-center gap-2 ${viewMode === 'weekly' ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-text-main'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${viewMode === 'weekly' ? 'bg-primary-500' : 'bg-transparent'}`} />
                      Weekly View
                    </button>
                    <button onClick={() => { setViewMode('monthly'); setDropdownOpen(false); }} className={`px-4 py-2.5 text-left text-sm font-semibold hover:bg-secondary-50 dark:hover:bg-bg-panel transition flex items-center gap-2 ${viewMode === 'monthly' ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-text-main'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${viewMode === 'monthly' ? 'bg-primary-500' : 'bg-transparent'}`} />
                      Monthly View
                    </button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => shiftDate(1)} className="p-1 hover:bg-secondary-200 dark:hover:bg-bg-card rounded">{'>'}</button>
          </div>
          <button
            onClick={handleExportCal}
            className="p-2 bg-white dark:bg-bg-card border border-border-main rounded-md shadow-premium hover:bg-primary-50 dark:hover:bg-primary-700 transition text-primary-500"
            title="Export to Calendar"
          >
            <Download size={18} />
          </button>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-primary-500 to-primary-300">
            {format(new Date(selectedDate), 'EEEE')}
          </h2>
          <p className="text-sm font-medium text-text-muted mt-1">Daily Task</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {tasksLoading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-border-main/50 rounded-xl"></div>)}
          </div>
        ) : dailyTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-text-muted border-2 border-dashed border-border-main rounded-xl">
             <CalendarIcon size={32} className="mb-2 opacity-50 text-primary-400" />
            <p>No tasks for today.</p>
          </div>
        ) : (
          dailyTasks.map((task) => (
            <div key={task._id}
              className="p-4 rounded-xl shadow-premium border border-border-main flex flex-col gap-2 transition hover:border-primary-400 dark:hover:border-primary-500 group relative overflow-hidden"
              style={{ backgroundColor: task.bgColor || undefined, color: task.textColor || undefined }}
            >
              {task.bgColor && <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: task.bgColor, filter: 'brightness(0.65)' }} />}
              <div className="flex items-start justify-between gap-3 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className={`font-semibold truncate ${!task.textColor ? 'text-text-main group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors' : ''}`}>{task.taskName}</h3>
                  {task.isRoutine && <span title="Routine Task" className="shrink-0"><RepeatIcon size={14} className="text-primary-500" /></span>}
                </div>
                <span className={`shrink-0 whitespace-nowrap text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                  task.status === 'DONE' ? 'bg-[#22c55e20] text-status-done' :
                  task.status === 'IN_PROGRESS' ? 'bg-[#3b82f620] text-status-in-progress' :
                  task.status === 'ABANDONED' ? 'bg-[#94a3b820] text-text-muted' :
                  'bg-[#94a3b820] text-status-not-started dark:text-text-muted'
                }`}>
                  {task.status.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="flex flex-col gap-1 mt-1">
                {(task.time || task.endTime) && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                    <Clock size={12} className="text-primary-400" />
                    <span>
                      {task.time || '--:--'}
                      {(task.endDate || task.endTime) && (
                        <> - {task.endDate && task.endDate !== task.date ? `${format(new Date(task.endDate), 'dd/MM')} ` : ''}{task.endTime || '--:--'}</>
                      )}
                    </span>
                  </p>
                )}
                {task.description && (
                  <p className="text-xs text-text-muted line-clamp-2 mt-1 hidden group-hover:block transition-all">{task.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border-main); border-radius: 4px; }
      `}} />
    </div>
  );
}
