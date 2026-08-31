import React, { useState } from 'react';
import { Task } from '../../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onSelectTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col h-full overflow-y-auto">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-50 dark:bg-brand-950/60 rounded-xl text-brand-600 dark:text-brand-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none">
              {monthNames[month]} {year}
            </h2>
            <span className="text-xs text-slate-400 mt-1 block">Project delivery schedule</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3.5 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Header Labels */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider shrink-0">
        <div className="py-1">Sun</div>
        <div className="py-1">Mon</div>
        <div className="py-1">Tue</div>
        <div className="py-1">Wed</div>
        <div className="py-1">Thu</div>
        <div className="py-1">Fri</div>
        <div className="py-1">Sat</div>
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-2.5 flex-1 min-h-0">
        {paddingDays.map((p) => (
          <div key={`pad-${p}`} className="bg-slate-50/40 dark:bg-slate-900/30 rounded-2xl p-2 border border-dashed border-slate-200/50 dark:border-slate-800/40 min-h-[110px]" />
        ))}

        {days.map((day) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTasks = tasks.filter((t) => t.due_date === dateStr || t.start_date === dateStr);
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

          return (
            <div
              key={day}
              className={`border rounded-2xl p-2.5 min-h-[110px] flex flex-col transition ${
                isToday
                  ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/30 shadow-xs ring-1 ring-brand-500/50'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2 shrink-0">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {day}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                    {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 overflow-y-auto flex-1 max-h-[85px]">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800/90 hover:bg-brand-50 dark:hover:bg-brand-950/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-[11px] font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer truncate flex items-center gap-1.5"
                    title={task.title}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      task.priority === 'URGENT' ? 'bg-rose-500' : task.priority === 'HIGH' ? 'bg-amber-500' : 'bg-brand-500'
                    }`} />
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{task.task_key}</span>
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
