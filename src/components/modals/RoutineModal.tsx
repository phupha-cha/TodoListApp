'use client';
import { useTaskStore } from '@/store/useTaskStore';
import { useState } from 'react';

export default function RoutineModal({ onClose }: { onClose: () => void }) {
  const { selectedDate, setSelectedDate } = useTaskStore();
  const [pattern, setPattern] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [taskName, setTaskName] = useState('');
  const [time, setTime] = useState('');
  const [startDate, setStartDate] = useState(selectedDate);
  const [loading, setLoading] = useState(false);
  const [conflictPrompt, setConflictPrompt] = useState(false);

  const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (idx: number) => {
    if (daysOfWeek.includes(idx)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== idx));
    } else {
      setDaysOfWeek([...daysOfWeek, idx].sort());
    }
  };

  const createRoutineRequest = async (resolution: string) => {
    setLoading(true);
    try {
      const payload = {
        pattern,
        daysOfWeek: pattern === 'WEEKLY' ? daysOfWeek : undefined,
        startDate,
        time,
        resolution,
        taskTemplate: {
          taskName,
        }
      };

      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 409) {
        setConflictPrompt(true);
        setLoading(false);
        return;
      }

      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName || !time || !startDate) return;
    if (pattern === 'WEEKLY' && daysOfWeek.length === 0) return;
    createRoutineRequest('NONE');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-border-main animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border-main bg-secondary-50 dark:bg-bg-panel">
          <h2 className="text-xl font-bold text-text-main">Create Routine</h2>
          <p className="text-sm text-text-muted mt-1">Generate automated tasks based on a schedule.</p>
        </div>
        
        {conflictPrompt ? (
          <div className="p-6 flex flex-col gap-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 p-5 rounded-xl border border-amber-200 dark:border-amber-800">
              <h3 className="font-bold mb-2 flex items-center gap-2">⚠️ Conflict Detected</h3>
              <p className="text-sm opacity-90">A routine already exists at <strong>{time}</strong>. How would you like to handle this?</p>
            </div>
            
            <div className="flex flex-col gap-3 mt-4">
              <button type="button" onClick={() => createRoutineRequest('REPLACE')} disabled={loading}
                className="w-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold py-3.5 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50 transition">
                Replace Existing
              </button>
              <button type="button" onClick={() => createRoutineRequest('MERGE')} disabled={loading}
                className="btn-premium w-full text-white font-bold py-3.5 rounded-xl shadow-premium transition">
                Merge (Keep Both)
              </button>
              <button type="button" onClick={() => setConflictPrompt(false)} disabled={loading}
                className="w-full py-2 text-text-muted mt-2 font-medium hover:text-text-main transition">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
            <div>
              <label className="block text-sm font-semibold mb-1 text-text-main">Routine Name *</label>
              <input required value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="e.g. Daily Standup"
                     className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition" />
            </div>

            <div className="flex gap-4">
               <div className="flex-1">
                 <label className="block text-sm font-semibold mb-1 text-text-main">Time *</label>
                 <input type="time" required value={time} onChange={e => setTime(e.target.value)} 
                        className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition" />
               </div>
               <div className="flex-1">
                 <label className="block text-sm font-semibold mb-1 text-text-main">Start Date *</label>
                 <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} 
                        className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition" />
               </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-main">Pattern</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPattern('DAILY')}
                  className={`flex-1 py-2 rounded-xl font-semibold transition border ${pattern === 'DAILY' ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20' : 'bg-secondary-50 dark:bg-bg-main text-text-muted border-border-main hover:bg-secondary-100 dark:hover:bg-primary-900/30'}`}>
                  Daily
                </button>
                <button type="button" onClick={() => setPattern('WEEKLY')}
                  className={`flex-1 py-2 rounded-xl font-semibold transition border ${pattern === 'WEEKLY' ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20' : 'bg-secondary-50 dark:bg-bg-main text-text-muted border-border-main hover:bg-secondary-100 dark:hover:bg-primary-900/30'}`}>
                  Weekly
                </button>
              </div>
            </div>

            {pattern === 'WEEKLY' && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-main">Select Days *</label>
                <div className="flex justify-between gap-1">
                  {WEEK_DAYS.map((day, idx) => (
                    <button key={day} type="button" onClick={() => toggleDay(idx)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition border ${daysOfWeek.includes(idx) ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 border-primary-500' : 'bg-secondary-50 dark:bg-bg-main text-text-muted border-border-main hover:bg-secondary-100 dark:hover:bg-primary-900/30'}`}>
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-main">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-text-muted hover:bg-secondary-100 dark:hover:bg-primary-900/40 transition">Cancel</button>
              <button type="submit" disabled={loading} className="btn-premium px-5 py-2.5 rounded-xl font-semibold shadow-premium disabled:opacity-50">
                {loading ? 'Processing...' : 'Create Routine'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
