import React, { useState } from 'react';
import { Task, BoardColumn } from '../../types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { ArrowUpDown, Calendar, MessageSquare, CheckSquare, ChevronRight } from 'lucide-react';

interface ListViewProps {
  columns: BoardColumn[];
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateTaskColumn: (taskId: number, columnId: number) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  columns,
  tasks,
  onSelectTask,
  onUpdateTaskColumn,
}) => {
  const [sortField, setSortField] = useState<'title' | 'priority' | 'due_date' | 'key'>('key');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: 'title' | 'priority' | 'due_date' | 'key') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'key') comparison = a.task_number - b.task_number;
    if (sortField === 'title') comparison = a.title.localeCompare(b.title);
    if (sortField === 'priority') {
      const priorityWeights = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      comparison = priorityWeights[b.priority] - priorityWeights[a.priority];
    }
    if (sortField === 'due_date') {
      comparison = (a.due_date || '').localeCompare(b.due_date || '');
    }
    return sortAsc ? comparison : -comparison;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th className="py-3.5 px-4 cursor-pointer" onClick={() => handleSort('key')}>
                <div className="flex items-center gap-1">
                  <span>Task Key</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1">
                  <span>Title</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 cursor-pointer" onClick={() => handleSort('priority')}>
                <div className="flex items-center gap-1">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer" onClick={() => handleSort('due_date')}>
                <div className="flex items-center gap-1">
                  <span>Due Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">Assignees</th>
              <th className="py-3.5 px-4 text-right">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {sortedTasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer group"
              >
                <td className="py-3 px-4 font-mono font-bold text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  {task.task_key}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  <div className="flex items-center gap-2">
                    <span>{task.title}</span>
                    {task.labels_detail.map((lbl) => (
                      <span
                        key={lbl.id}
                        className="px-1.5 py-0.5 text-[9px] font-bold rounded text-white"
                        style={{ backgroundColor: lbl.color }}
                      >
                        {lbl.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      (task.column_name || '').toLowerCase().includes('done') || (task.column_name || '').toLowerCase().includes('complet')
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        : (task.column_name || '').toLowerCase().includes('progress') || (task.column_name || '').toLowerCase().includes('review') || (task.column_name || '').toLowerCase().includes('doing')
                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                        : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20'
                    }`}
                  >
                    {task.column_name || 'To Do'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Badge priority={task.priority}>{task.priority}</Badge>
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {task.assignees_detail.map((user) => (
                      <Avatar key={user.id} src={user.avatar} name={user.full_name} size="xs" />
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  {task.subtask_stats.total > 0 ? (
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      {task.subtask_stats.completed}/{task.subtask_stats.total} subtasks
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
            {sortedTasks.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No tasks in list view
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
