import React from 'react';
import { Task } from '../../types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Clock, Calendar as CalendarIcon, User } from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onSelectTask }) => {
  const today = new Date();
  const timelineDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 2 + i);
    return d;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col h-full">
      {/* Header Banner */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Interactive Gantt Schedule & Timeline
            </h2>
            <p className="text-xs text-slate-400">Visual delivery roadmap across active sprint days</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold rounded-full">
          14-Day Sprint Window
        </span>
      </div>

      {/* Horizontal Gantt Table Container */}
      <div className="overflow-x-auto flex-1 p-4">
        <div className="min-w-[1100px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
          {/* Table Header: Task Sidebar Header + 14 Date Columns */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/80">
            {/* Task Name Column Header */}
            <div className="w-72 shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Task & Assignee</span>
            </div>

            {/* 14 Fixed Date Headers */}
            <div className="flex-1 flex divide-x divide-slate-200 dark:divide-slate-800">
              {timelineDays.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString();
                return (
                  <div
                    key={i}
                    className={`flex-1 min-w-[70px] py-2.5 text-center flex flex-col items-center justify-center transition ${
                      isToday ? 'bg-brand-50/80 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString([], { weekday: 'short' })}</span>
                    <span className={`text-xs font-extrabold px-1.5 py-0.5 rounded-full mt-0.5 ${
                      isToday ? 'bg-brand-600 text-white' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Rows: Task Sidebar + Duration Bar */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map((task, idx) => {
              const startOffset = (task.id % 4) * 7; // % position offset
              const barWidth = Math.min(60, (task.story_points || 3) * 12 + 20);

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="flex items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                >
                  {/* Task Metadata Column */}
                  <div className="w-72 shrink-0 px-4 py-3.5 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">{task.task_key}</span>
                        <Badge priority={task.priority}>{task.priority}</Badge>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">{task.title}</h4>
                    </div>
                    <div className="flex -space-x-1.5 shrink-0">
                      {task.assignees_detail.map((u) => (
                        <Avatar key={u.id} src={u.avatar} name={u.full_name} size="xs" />
                      ))}
                    </div>
                  </div>

                  {/* Horizontal Bar Chart Track */}
                  <div className="flex-1 p-2 relative flex items-center h-14 bg-slate-50/30 dark:bg-slate-900/30">
                    <div
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs flex items-center px-3 gap-2 text-xs font-bold transition-all relative z-10"
                      style={{
                        marginLeft: `${startOffset}%`,
                        width: `${barWidth}%`,
                      }}
                    >
                      <span className="truncate">{task.title}</span>
                      <span className="text-[10px] font-extrabold bg-white/20 px-1.5 py-0.5 rounded-full ml-auto shrink-0">
                        {task.story_points || 3} pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
