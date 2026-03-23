'use client';
import { useState } from 'react';
import { useTaskStore, AppTask } from '@/store/useTaskStore';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Trash2 } from 'lucide-react';

const MySwal = withReactContent(Swal);

export default function EditTaskModal({ task, onClose }: { task: AppTask, onClose: () => void }) {
  const { setTasks, tasks, triggerRefresh } = useTaskStore();
  const [taskName, setTaskName] = useState(task.taskName);
  const [date, setDate] = useState(task.date);
  const [time, setTime] = useState(task.time || '');
  const [endDate, setEndDate] = useState(task.endDate || '');
  const [endTime, setEndTime] = useState(task.endTime || '');
  const [location, setLocation] = useState(task.location || '');
  const [description, setDescription] = useState(task.description || '');
  const [bgColor, setBgColor] = useState(task.bgColor || '');
  const [textColor, setTextColor] = useState(task.textColor || '');
  const [loading, setLoading] = useState(false);

  const isDone = task.status === 'DONE';

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDone) return;
    
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
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName, date, time, endDate, endTime, location, description, bgColor: bgColor || undefined, textColor: textColor || undefined })
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(tasks.map(t => t._id === task._id ? updated : t));
        showSuccess('Task updated!');
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (task.isRoutine && task.routineId) {
      MySwal.fire({
        title: 'Delete Routine?',
        text: 'Do you want to delete just this task, or the entire routine schedule?',
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Entire Routine',
        denyButtonText: 'Just This Task',
        cancelButtonText: 'Cancel',
        background: 'var(--color-bg-card)',
        color: 'var(--color-text-main)'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await fetch(`/api/routines/${task.routineId}`, { method: 'DELETE' });
          showSuccess('Routine schedule deleted');
          triggerRefresh();
          onClose();
        } else if (result.isDenied) {
          await fetch(`/api/tasks/${task._id}`, { method: 'DELETE' });
          setTasks(tasks.filter(t => t._id !== task._id));
          showSuccess('Task deleted from this day');
          onClose();
        }
      });
    } else {
      MySwal.fire({
        title: 'Delete Task?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        background: 'var(--color-bg-card)',
        color: 'var(--color-text-main)'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await fetch(`/api/tasks/${task._id}`, { method: 'DELETE' });
          setTasks(tasks.filter(t => t._id !== task._id));
          showSuccess('Task Deleted');
          onClose();
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-bg-card rounded-2xl w-full max-w-[450px] shadow-2xl overflow-hidden border border-border-main animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-border-main bg-secondary-50 dark:bg-bg-panel flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-main">
            {isDone ? 'Task Details' : 'Edit Task'}
          </h2>
          <button type="button" onClick={handleDelete} className="text-red-500 hover:text-red-600 transition p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg" title="Delete">
            <Trash2 size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-text-main">Title</label>
            <input required value={taskName} onChange={e => setTaskName(e.target.value)} disabled={isDone}
                   className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 transition disabled:opacity-60" />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1 text-text-main">Start Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} disabled={isDone}
                     className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 transition disabled:opacity-60" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1 text-text-main">Start Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} disabled={isDone}
                     className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 transition disabled:opacity-60" />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1 text-text-main">End Date</label>
              <input type="date" value={endDate} min={date} onChange={e => setEndDate(e.target.value)} disabled={isDone}
                     className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 transition disabled:opacity-60" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1 text-text-main">End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={isDone}
                     className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 transition disabled:opacity-60" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-text-main">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} disabled={isDone}
                   className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 transition disabled:opacity-60" />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1 text-text-main">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} disabled={isDone}
                      className="w-full bg-secondary-50 dark:bg-bg-main border border-border-main rounded-xl px-4 py-2 outline-none focus:border-primary-400 focus:ring-1 transition resize-none disabled:opacity-60" />
          </div>

          {!isDone && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-main">Card Color</label>
              <div className="flex gap-4">
                <div>
                  <p className="text-[11px] text-text-muted mb-1 font-medium">Background</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {['', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#ede9fe', '#fee2e2', '#f0fdf4', '#0f172a', '#1e3a5f'].map(c => (
                      <button key={c || 'default'} type="button" onClick={() => setBgColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition ${bgColor === c ? 'border-primary-500 scale-110' : 'border-border-main'}`}
                        style={{ background: c || 'var(--color-bg-card)' }}
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
                        style={{ background: c || 'var(--color-text-main)' }}
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
          )}

          {isDone && <p className="text-xs text-status-done font-bold text-center mt-2 px-3 py-2 bg-status-done/10 rounded-lg">This task is marked as DONE and its details are locked. It can still be deleted.</p>}
          
          <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-border-main">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-text-muted hover:bg-secondary-100 dark:hover:bg-bg-panel transition">Close</button>
            {!isDone && (
              <button type="submit" disabled={loading} className="btn-premium px-5 py-2.5 rounded-xl font-semibold shadow-premium disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
