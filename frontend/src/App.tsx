import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WebSocketProvider, useWebSocket, firePresenceConnect } from './context/WebSocketContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/ui/ToastContainer';
import { KanbanView } from './components/board/KanbanView';
import { ListView } from './components/board/ListView';
import { CalendarView } from './components/board/CalendarView';
import { TimelineView } from './components/board/TimelineView';
import { DashboardView } from './components/analytics/DashboardView';
import { TeamView } from './components/workspace/TeamView';
import { TaskDetailDrawer } from './components/task/TaskDetailDrawer';
import { AuthModal } from './components/auth/AuthModal';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { CreateTaskModal } from './components/modals/CreateTaskModal';
import { InviteMemberModal } from './components/modals/InviteMemberModal';
import { Project, Task, BoardColumn, ViewMode, ActivityLog, User } from './types';
import { projectAPI, taskAPI, activityAPI, authAPI } from './services/api';
import { ThreeBackground } from './components/ui/ThreeBackground';
import { Kanban, List, Calendar, Clock, Plus } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, currentWorkspace, isLoading: isAuthLoading } = useAuth();
  const { connectToProject, lastMessage } = useWebSocket();
  const { addToast } = useNotifications();

  const [activeView, setActiveView] = useState<'dashboard' | 'board' | 'tasks' | 'team' | 'settings'>('dashboard');
  const [boardViewMode, setBoardViewMode] = useState<ViewMode>('kanban');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [allWorkspaceTasks, setAllWorkspaceTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Modal controls
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedColumnForTask, setSelectedColumnForTask] = useState<number | undefined>(undefined);
  const [teamRefreshTrigger, setTeamRefreshTrigger] = useState(0);

  // Fetch all tasks in the current workspace for search
  const fetchAllWorkspaceTasks = async () => {
    if (!currentWorkspace) return;
    try {
      const res = await taskAPI.list({ workspace: currentWorkspace.id });
      const tasksList = Array.isArray(res.data) ? res.data : ((res.data as any)?.results || []);
      setAllWorkspaceTasks(tasksList);
    } catch (err) {
      console.error('Failed to fetch workspace tasks', err);
    }
  };

  useEffect(() => {
    if (user && currentWorkspace) {
      fetchAllWorkspaceTasks();
    }
  }, [user, currentWorkspace?.id]);

  // Fetch Projects when Workspace changes
  const fetchProjects = async () => {
    if (!currentWorkspace) return;
    setIsLoadingData(true);
    try {
      const res = await projectAPI.list(currentWorkspace.id);
      const projList = Array.isArray(res.data) ? res.data : ((res.data as any)?.results || []);
      setProjects(projList);
      if (projList.length > 0) {
        setCurrentProject((prev) => {
          if (!prev || !projList.some((p: Project) => p.id === prev.id)) {
            return projList[0];
          }
          return prev;
        });
      } else {
        setCurrentProject(null);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
      setProjects([]);
      setCurrentProject(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fire workspace presence whenever workspace or token changes
  useEffect(() => {
    if (currentWorkspace && user) {
      fetchProjects();
      const token = localStorage.getItem('pulse_access_token');
      firePresenceConnect(currentWorkspace.id, token, user.id);
    }
  }, [currentWorkspace?.id, user?.id]);

  // Fetch Columns and Tasks when current project changes
  const fetchProjectData = async () => {
    if (!currentProject) return;
    try {
      const colsRes = await projectAPI.getColumns(currentProject.id);
      const colsList = Array.isArray(colsRes.data) ? colsRes.data : ((colsRes.data as any)?.results || []);
      setColumns(colsList);

      const tasksRes = await taskAPI.list({ project: currentProject.id });
      const tasksList = Array.isArray(tasksRes.data) ? tasksRes.data : ((tasksRes.data as any)?.results || []);
      setTasks(tasksList);

      const actRes = await activityAPI.list(currentProject.id);
      const actList = Array.isArray(actRes.data) ? actRes.data : ((actRes.data as any)?.results || []);
      setActivities(actList);

      connectToProject(currentProject.id);
      fetchAllWorkspaceTasks();
    } catch (err) {
      console.error('Failed to fetch project columns and tasks', err);
    }
  };

  useEffect(() => {
    if (currentProject) {
      fetchProjectData();
    }
  }, [currentProject]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await authAPI.getUsers();
        const usersList = Array.isArray(res.data) ? res.data : ((res.data as any)?.results || []);
        setAllUsers(usersList);
      } catch (err) {
        console.error(err);
        setAllUsers([]);
      }
    };
    if (user) fetchUsers();
  }, [user]);

  // Navigate to task's project view when selected from search
  const handleSelectTaskFromSearch = (task: Task) => {
    const targetProj = projects.find((p) => p.id === task.project);
    if (targetProj) {
      setCurrentProject(targetProj);
    }
    setActiveView('board');
  };

  // Handle incoming real-time WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'task_created' || lastMessage.type === 'board_update') {
        fetchProjectData();
        fetchAllWorkspaceTasks();
      }
    }
  }, [lastMessage]);

  const handleTaskMove = async (taskId: number, newColumnId: number, newIndex: number) => {
    // Optimistic UI update
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === taskId ? { ...t, column: newColumnId, order: newIndex } : t))
    );

    try {
      await taskAPI.move(taskId, newColumnId, newIndex);
    } catch (err) {
      fetchProjectData();
      addToast('Error', 'Failed to move task on server.', 'error');
    }
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wider">Loading Pulse Enterprise Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.task_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans relative">
      <ThreeBackground />
      {/* Sidebar Navigation */}
      <Sidebar
        currentProject={currentProject}
        projects={projects}
        onSelectProject={(p) => setCurrentProject(p)}
        activeView={activeView}
        onNavigate={(v) => setActiveView(v)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Header
          currentProject={activeView === 'board' ? currentProject : null}
          projects={projects}
          tasks={allWorkspaceTasks.length > 0 ? allWorkspaceTasks : tasks}
          onOpenCreateTask={() => {
            setSelectedColumnForTask(undefined);
            setIsCreateTaskOpen(true);
          }}
          onSelectProject={(p) => {
            setCurrentProject(p);
            setActiveView('board');
          }}
          onSelectTask={(t) => handleSelectTaskFromSearch(t)}
          taskCount={searchQuery.trim() ? filteredTasks.length : undefined}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.trim() !== '' && activeView !== 'board' && activeView !== 'tasks' && activeView !== 'dashboard') {
              setActiveView('board');
            }
          }}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* View Switcher Sub-header for Board View */}
        {activeView === 'board' && currentProject && (
          <div className="px-3 sm:px-6 py-2 sm:py-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto flex-1 max-w-full">
              <button
                onClick={() => setBoardViewMode('kanban')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  boardViewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Kanban</span>
              </button>
              <button
                onClick={() => setBoardViewMode('list')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  boardViewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">List</span>
              </button>
              <button
                onClick={() => setBoardViewMode('calendar')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  boardViewMode === 'calendar'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Calendar</span>
              </button>
              <button
                onClick={() => setBoardViewMode('timeline')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  boardViewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Timeline</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
              <span>{filteredTasks.length} tasks</span>
            </div>
          </div>
        )}

        {/* Dynamic Page Body Content */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto min-h-0 bg-slate-50/50 dark:bg-slate-950/50">
          {activeView === 'dashboard' && (
            <DashboardView
              projects={projects}
              tasks={filteredTasks}
              activities={activities}
              onSelectTask={(t) => setSelectedTask(t)}
              onSelectProject={(p) => {
                setCurrentProject(p);
                setActiveView('board');
              }}
            />
          )}

          {activeView === 'board' && !currentProject && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center mb-4">
                <Kanban className="w-8 h-8 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Project Selected</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6">
                Create a new project or select an existing project from the sidebar to open the Kanban board.
              </p>
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
              >
                + Create First Project
              </button>
            </div>
          )}

          {activeView === 'board' && currentProject && (
            <div className="h-full">
              {boardViewMode === 'kanban' && (
                <KanbanView
                  columns={columns}
                  tasks={filteredTasks}
                  onTaskMove={handleTaskMove}
                  onSelectTask={(t) => setSelectedTask(t)}
                  onOpenCreateTaskInColumn={(colId) => {
                    setSelectedColumnForTask(colId);
                    setIsCreateTaskOpen(true);
                  }}
                />
              )}
              {boardViewMode === 'list' && (
                <ListView
                  columns={columns}
                  tasks={filteredTasks}
                  onSelectTask={(t) => setSelectedTask(t)}
                  onUpdateTaskColumn={(taskId, colId) => handleTaskMove(taskId, colId, 0)}
                />
              )}
              {boardViewMode === 'calendar' && (
                <CalendarView tasks={filteredTasks} onSelectTask={(t) => setSelectedTask(t)} />
              )}
              {boardViewMode === 'timeline' && (
                <TimelineView tasks={filteredTasks} onSelectTask={(t) => setSelectedTask(t)} />
              )}
            </div>
          )}

          {activeView === 'tasks' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Assigned Tasks</h2>
              <ListView
                columns={columns}
                tasks={filteredTasks.filter((t) => t.assignees.includes(user.id))}
                onSelectTask={(t) => setSelectedTask(t)}
                onUpdateTaskColumn={(taskId, colId) => handleTaskMove(taskId, colId, 0)}
              />
            </div>
          )}

          {activeView === 'team' && (
            <TeamView
              onOpenInviteModal={() => setIsInviteModalOpen(true)}
              refreshTrigger={teamRefreshTrigger}
            />
          )}

          {activeView === 'settings' && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Profile & Settings</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wider block">Full Name</label>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{user.full_name}</p>
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wider block">Email Address</label>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{user.email}</p>
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wider block">Job Title</label>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{user.job_title || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        columns={columns}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={fetchProjectData}
        onTaskDeleted={(taskId) => {
          setTasks((prev) => prev.filter((t) => t.id !== taskId));
          setSelectedTask(null);
        }}
        allUsers={allUsers}
      />

      {/* Dialog Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={fetchProjects}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        project={currentProject}
        columns={columns}
        defaultColumnId={selectedColumnForTask}
        onTaskCreated={fetchProjectData}
        allUsers={allUsers}
      />

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onMemberInvited={() => setTeamRefreshTrigger((prev) => prev + 1)}
      />

      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <WebSocketProvider>
            <MainAppContent />
          </WebSocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
