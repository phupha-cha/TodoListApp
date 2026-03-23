'use client';
import { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TaskModal({ onClose }: { onClose: () => void }) {
  const { selectedDate, addTask, triggerRefresh } = useTaskStore();
  
  const [isRoutine, setIsRoutine] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [date, setDate] = useState(selectedDate || format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [bgColor, setBgColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [loading, setLoading] = useState(false);

  // Routine Specific config
  const [pattern, setPattern] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [conflictPrompt, setConflictPrompt] = useState(false);

  const toggleDay = (idx: number) => {
    if (daysOfWeek.includes(idx)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== idx));
    } else {
      setDaysOfWeek([...daysOfWeek, idx].sort());
    }
  };

  const showSuccess = (msg: string) => {
    MySwal.fire({
      icon: 'success',
      title: 'Success!',
      text: msg,
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      background: 'var(--color-bg-card)',
      color: 'var(--color-text-main)'
    });
  };

  const createNormalTask = async () => {
    const payload = { taskName, date, time, location, description, endDate, endTime, bgColor: bgColor || undefined, textColor: textColor || undefined };
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const newTask = await res.json();
      addTask(newTask);
      showSuccess('Task created successfully');
      onClose();
    }
  };

  const createRoutineRequest = async (resolution: string) => {
    const payload = {
      pattern,
      daysOfWeek: pattern === 'WEEKLY' ? daysOfWeek : undefined,
      startDate: date,
      time,
      endDate,
      endTime,
      bgColor: bgColor || undefined,
      textColor: textColor || undefined,
      resolution,
      taskTemplate: { taskName, location, description }
    };
    const res = await fetch('/api/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 409) {
      setConflictPrompt(true);
      return;
    }

    if (res.ok) {
      showSuccess('Routine successfully enabled');
      triggerRefresh();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName) return;
    if (isRoutine && pattern === 'WEEKLY' && daysOfWeek.length === 0) {
      MySwal.fire({ icon: 'error', title: 'Oops', text: 'Select at least 1 day for a weekly routine' });
      return;
    }
    if (endDate) {
      if (endDate < date) {
        MySwal.fire({ icon: 'error', title: 'Invalid Date', text: 'End Date cannot be before Start Date', background: 'var(--color-bg-card)', color: 'var(--color-text-main)' });
        return;
      }
      if (endDate === date && endTime && time && endTime < time) {
        MySwal.fire({ icon: 'error', title: 'Invalid Time', text: 'End Time cannot be before Start Time on the same day', background: 'var(--color-bg-card)', color: 'var(--color-text-main)' });
        return;
      }
    }
    setLoading(true);
    try {
      if (isRoutine) {
        await createRoutineRequest('NONE');
      } else {
        await createNormalTask();
      }
    } catch (err) {
      console.error(err);
    } finally {
      if(!conflictPrompt) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-bg-card rounded-2xl w-full max-w-[450px] shadow-2xl overflow-hidden border border-border-main animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-border-main bg-secondary-50 dark:bg-bg-panel">
          <h2 className="text-xl font-bold text-text-main">Create New Item</h2>
        </div>
        
        {conflictPrompt ? (
          <div className="p-6 flex flex-col gap-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 p-5 rounded-xl border border-amber-200 dark:border-amber-800">
              <h3 className="font-bold mb-2 flex items-center gap-2">⚠️ Conflict Detected</h3>
              <p className="text-sm opacity-90">A routine already exists at <strong>{time}</strong>. How would you like to handle this?</p>
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <button type="button" onClick={() => createRoutineRequest('REPLACE')} disabled={loading}
                className="w-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold py-3.5 rounded-xl transition">
                Replace Existing
              </button>
              <button type="button" onClick={() => createRoutineRequest('MERGE')} disabled={loading}
                className="btn-premium w-full text-white font-bold py-3.5 rounded-xl shadow-premium transition">
                Merge (Keep Both)
              </button>
              <button type="button" onClick={() => { setConflictPrompt(false); setLoading(false); }} disabled={loading}
                className="w-full py-2 text-text-muted mt-2 font-medium hover:text-text-main transition">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex bg-secondary-100 dark:bg-bg-main p-1 rounded-xl shadow-inner">
              <button type="button" 
                className={`flex-1 py-2 font-semibold rounded-lg text-sm transition-all focus:outline-none ${!isRoutine ? 'bg-white shadow-sm dark:bg-primary-600 text-text-main' : 'text-text-muted hover:text-text-main'}`} 
                onClick={() => setIsRoutine(false)}>One Time Task</button>
              <button type="button" 
                className={`flex-1 py-2 font-semibold rounded-lg text-sm transition-all focus:outline-none ${isRoutine ? 'bg-white shadow-sm dark:bg-primary-600 text-text-main' : 'text-text-muted hover:text-text-main'}`} 
                onClick={() => setIsRoutine(true)}>Routine Task</button>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-text-main">Title *</label>
              <input required autoFocus value={taskName} onChange={e => setTaskName(e.target.value)} 
                     className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition" />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1 text-text-main">Start Date *</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} 
                       className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1 text-text-main">Start Time *</label>
                <input type="time" required value={time} onChange={e => setTime(e.target.value)} 
                       className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition" />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1 text-text-main">End Date (Optional)</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} 
                       className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1 text-text-main">End Time (Optional)</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} 
                       className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition" />
              </div>
            </div>

            {isRoutine && (
              <div className="p-4 bg-primary-50 dark:bg-bg-main border border-primary-200 dark:border-border-main rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider mb-2 text-primary-800 dark:text-primary-200">Repeat Pattern</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPattern('DAILY')}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition border ${pattern === 'DAILY' ? 'bg-primary-500 text-white border-primary-500' : 'bg-transparent dark:bg-bg-panel text-text-muted border-border-main'}`}>
                      Daily
                    </button>
                    <button type="button" onClick={() => setPattern('WEEKLY')}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition border ${pattern === 'WEEKLY' ? 'bg-primary-500 text-white border-primary-500' : 'bg-transparent dark:bg-bg-panel text-text-muted border-border-main'}`}>
                      Weekly
                    </button>
                  </div>
                </div>

                {pattern === 'WEEKLY' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-primary-800 dark:text-primary-200">Select Days</label>
                    <div className="flex flex-wrap justify-between gap-1">
                      {WEEK_DAYS.map((day, idx) => (
                        <button key={day} type="button" onClick={() => toggleDay(idx)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition border ${daysOfWeek.includes(idx) ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/30' : 'bg-white dark:bg-bg-card text-text-muted border-border-main'}`}>
                          {day[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold mb-1 text-text-main">Location (Optional)</label>
              <input value={location} onChange={e => setLocation(e.target.value)} 
                     className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-text-main">Description (Optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                        className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition resize-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-main">Card Color (Optional)</label>
              <div className="flex gap-3 items-center">
                <div>
                  <p className="text-[11px] text-text-muted mb-1 font-medium">Background</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {['', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#ede9fe', '#fee2e2', '#f0fdf4', '#0f172a', '#1e3a5f'].map(c => (
                      <button key={c || 'default'} type="button" onClick={() => setBgColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition ${bgColor === c ? 'border-primary-500 scale-110' : 'border-border-main'}`}
                        style={{ background: c || 'var(--color-bg-card)' }} title={c || 'Default'}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-text-muted mb-1 font-medium">Text</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {['', '#1e293b', '#ffffff', '#0284c7', '#16a34a', '#dc2626', '#7c3aed', '#b45309'].map(c => (
                      <button key={c || 'default'} type="button" onClick={() => setTextColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition ${textColor === c ? 'border-primary-500 scale-110' : 'border-border-main'}`}
                        style={{ background: c || 'var(--color-text-main)' }} title={c || 'Default'}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {(bgColor || textColor) && (
                <div className="mt-2 p-2 rounded-lg border border-border-main text-xs font-semibold text-center" style={{ background: bgColor || undefined, color: textColor || undefined }}>
                  Preview Text
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-border-main">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-text-muted hover:bg-secondary-100 dark:hover:bg-primary-900/40 transition">Cancel</button>
              <button type="submit" disabled={loading} className="btn-premium px-5 py-2.5 rounded-xl font-semibold shadow-premium disabled:opacity-50">
                {loading ? 'Processing...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
