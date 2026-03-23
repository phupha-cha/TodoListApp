'use client';
import { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, BarChart2, CheckCircle2, CircleDashed } from 'lucide-react';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function ReportModal({ onClose }: { onClose: () => void }) {
  const { selectedDate } = useTaskStore();
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [referenceDate, setReferenceDate] = useState(new Date(selectedDate));
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ doneCount: 0, notDoneCount: 0, totalCount: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      let startStr = '';
      let endStr = '';

      if (reportType === 'daily') {
        startStr = format(referenceDate, 'yyyy-MM-dd');
        endStr = startStr;
      } else if (reportType === 'weekly') {
        const start = startOfWeek(referenceDate, { weekStartsOn: 0 });
        const end = endOfWeek(referenceDate, { weekStartsOn: 0 });
        startStr = format(start, 'yyyy-MM-dd');
        endStr = format(end, 'yyyy-MM-dd');
      } else if (reportType === 'monthly') {
        const start = startOfMonth(referenceDate);
        const end = endOfMonth(referenceDate);
        startStr = format(start, 'yyyy-MM-dd');
        endStr = format(end, 'yyyy-MM-dd');
      } else if (reportType === 'yearly') {
        const start = startOfYear(referenceDate);
        const end = endOfYear(referenceDate);
        startStr = format(start, 'yyyy-MM-dd');
        endStr = format(end, 'yyyy-MM-dd');
      }

      try {
        const res = await fetch(`/api/report?start=${startStr}&end=${endStr}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error('Failed to fetch stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [reportType, referenceDate]);

  const shiftDate = (dir: 1 | -1) => {
    let newDate = new Date(referenceDate);
    if (reportType === 'daily') newDate = addDays(newDate, dir * 1);
    else if (reportType === 'weekly') newDate = addDays(newDate, dir * 7);
    else if (reportType === 'monthly') newDate = new Date(newDate.getFullYear(), newDate.getMonth() + dir, 1);
    else if (reportType === 'yearly') newDate = new Date(newDate.getFullYear() + dir, 0, 1);
    setReferenceDate(newDate);
  };

  const getDisplayTitle = () => {
    if (reportType === 'daily') return format(referenceDate, 'dd MMM yyyy');
    if (reportType === 'weekly') {
        const start = startOfWeek(referenceDate, { weekStartsOn: 0 });
        const end = endOfWeek(referenceDate, { weekStartsOn: 0 });
        return `${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy')}`;
    }
    if (reportType === 'monthly') return format(referenceDate, 'MMMM yyyy');
    if (reportType === 'yearly') return format(referenceDate, 'yyyy');
    return '';
  };

  const completionRate = stats.totalCount === 0 ? 0 : Math.round((stats.doneCount / stats.totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-bg-card rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden border border-border-main animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="p-5 border-b border-border-main bg-secondary-50 dark:bg-bg-panel flex justify-between items-center">
          <div className="flex items-center gap-2 text-text-main">
            <BarChart2 className="text-primary-500" />
            <h2 className="text-xl font-bold">Productivity Report</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-text-muted hover:bg-secondary-200 dark:hover:bg-bg-main transition">
            ✕
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <div className="bg-secondary-100 dark:bg-bg-main rounded-xl p-1 flex shadow-inner">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(type => (
              <button key={type} onClick={() => setReportType(type)}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-lg capitalize transition ${reportType === type ? 'bg-white shadow-sm dark:bg-primary-600 text-text-main' : 'text-text-muted hover:text-text-main'}`}>
                {type}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center bg-secondary-50 dark:bg-bg-panel px-4 py-3 rounded-xl border border-border-main">
            <button onClick={() => shiftDate(-1)} className="p-1 text-text-muted hover:text-primary-500 transition"><ChevronLeft size={20}/></button>
            <span className="font-bold text-text-main">{getDisplayTitle()}</span>
            <button onClick={() => shiftDate(1)} className="p-1 text-text-muted hover:text-primary-500 transition"><ChevronRight size={20}/></button>
          </div>

          <div style={{ minHeight: '320px' }}>
          {loading ? (
            <div className="flex justify-center items-center h-full" style={{ minHeight: '320px' }}>
              <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="bg-bg-card border border-border-main rounded-xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-primary-500/5 to-transparent"></div>
                
                <h3 className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2 relative z-10">Completion Rate</h3>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-primary-500 to-primary-300 relative z-10 mb-4">
                  {completionRate}%
                </div>

                <div className="w-full bg-secondary-200 dark:bg-bg-main h-3 rounded-full overflow-hidden relative z-10">
                  <div className="bg-primary-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${completionRate}%` }}></div>
                </div>
                <div className="flex justify-between w-full mt-2 text-xs font-semibold text-text-muted relative z-10">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-status-done/10 border border-status-done/20 rounded-xl p-4 flex flex-col gap-1 items-center justify-center text-center">
                  <CheckCircle2 className="text-status-done mb-1" size={24} />
                  <span className="text-2xl font-bold text-status-done">{stats.doneCount}</span>
                  <span className="text-xs font-semibold text-status-done/80 uppercase tracking-wider">Completed</span>
                </div>
                
                <div className="flex-1 bg-text-muted/10 border border-text-muted/20 rounded-xl p-4 flex flex-col gap-1 items-center justify-center text-center">
                  <CircleDashed className="text-text-muted mb-1" size={24} />
                  <span className="text-2xl font-bold text-text-main dark:text-text-muted">{stats.notDoneCount}</span>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Pending</span>
                </div>
              </div>

              <div className="text-center text-sm font-medium text-text-muted">
                Total Output: <strong className="text-primary-500">{stats.totalCount}</strong> Assigned Tasks
              </div>
            </div>
          )}</div>
        </div>
      </div>
    </div>
  );
}
