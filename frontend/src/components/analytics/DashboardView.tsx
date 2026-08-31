import React from 'react';
import { Task, Project, ActivityLog } from '../../types';
import { 
  CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp, 
  BarChart3, Activity, ArrowRight, ShieldAlert, Sparkles 
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface DashboardViewProps {
  projects: Project[];
  tasks: Task[];
  activities: ActivityLog[];
  onSelectTask: (task: Task) => void;
  onSelectProject: (p: Project) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  tasks,
  activities,
  onSelectTask,
  onSelectProject,
}) => {
  const { user } = useAuth();

  const myTasks = tasks.filter((t) => t.assignees.includes(user?.id || 0));
  const urgentTasks = tasks.filter((t) => t.priority === 'URGENT' && !t.is_archived);
  const completedTasks = tasks.filter((t) => t.column_name?.toLowerCase().includes('done') || t.column_name?.toLowerCase().includes('complete'));
  const totalTasks = tasks.length || 1;
  const completionRate = Math.round((completedTasks.length / totalTasks) * 100);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs transition-colors">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Workspace Executive Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {user?.first_name || user?.username}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
            You have <span className="font-bold text-slate-900 dark:text-white">{myTasks.length} assigned tasks</span> across {projects.length} active workspace projects. Live status & metrics are synced.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tasks</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{tasks.length}</h3>
            <p className="text-[11px] font-semibold text-emerald-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Across all projects
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <ListTodo className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{completedTasks.length}</h3>
            <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mt-1">
              {completionRate}% completion rate
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Assigned</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{myTasks.length}</h3>
            <p className="text-[11px] font-semibold text-indigo-500 mt-1">Active items</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Urgent Priority</p>
            <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{urgentTasks.length}</h3>
            <p className="text-[11px] font-semibold text-rose-500 mt-1">Requires focus</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Projects Overview & Task Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Cards Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects Progress Cards */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-600" />
              Active Projects Progress
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((proj) => {
                const projTasks = tasks.filter((t) => t.project === proj.id);
                const projDone = projTasks.filter((t) => t.column_name?.toLowerCase().includes('done') || t.column_name?.toLowerCase().includes('complete'));
                const pRate = projTasks.length > 0 ? Math.round((projDone.length / projTasks.length) * 100) : 0;

                return (
                  <div
                    key={proj.id}
                    onClick={() => onSelectProject(proj)}
                    className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color || '#6366F1' }}
                        />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 transition">
                          {proj.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">{proj.key}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        <span>{projTasks.length} Tasks</span>
                        <span>{pRate}% Done</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Tasks Table */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              My Assigned Tasks ({myTasks.length})
            </h3>
            <div className="space-y-2">
              {myTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl hover:bg-brand-50/50 dark:hover:bg-brand-950/40 transition cursor-pointer border border-slate-200/50 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-400">{task.task_key}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge priority={task.priority}>{task.priority}</Badge>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                      {task.column_name}
                    </span>
                  </div>
                </div>
              ))}
              {myTasks.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">No tasks assigned to you</p>
              )}
            </div>
          </div>
        </div>

        {/* Activity Stream Sidebar */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" />
            Recent Workspace Activity
          </h3>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[450px] pr-1">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs">
                <Avatar src={act.user_detail?.avatar} name={act.user_detail?.full_name || 'System'} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-snug">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{act.user_detail?.full_name || 'User'}</span>{' '}
                    {act.description}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
