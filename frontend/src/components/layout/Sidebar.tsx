import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Project } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  LayoutDashboard, CheckSquare, Users, Settings, 
  Plus, ChevronDown, Moon, Sun, LogOut, Briefcase, AlertTriangle, X
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface SidebarProps {
  currentProject: Project | null;
  projects: Project[];
  onSelectProject: (p: Project) => void;
  activeView: 'dashboard' | 'board' | 'tasks' | 'team' | 'settings';
  onNavigate: (view: 'dashboard' | 'board' | 'tasks' | 'team' | 'settings') => void;
  onOpenCreateProject: () => void;
  onOpenInviteModal: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentProject,
  projects,
  onSelectProject,
  activeView,
  onNavigate,
  onOpenCreateProject,
  isOpen,
  onClose,
}) => {
  const { user, currentWorkspace, workspaces, setCurrentWorkspace, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleNavigate = (view: 'dashboard' | 'board' | 'tasks' | 'team' | 'settings') => {
    onNavigate(view);
    onClose(); // close sidebar on mobile after navigation
  };

  const handleSelectProject = (p: Project) => {
    onSelectProject(p);
    onNavigate('board');
    onClose();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          flex flex-col shrink-0 h-screen transition-transform duration-300 select-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition md:hidden z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Workspace Switcher Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 relative">
          <button
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0">
                {currentWorkspace?.name ? currentWorkspace.name[0].toUpperCase() : 'N'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  {currentWorkspace?.name || 'NexusFlow Workspace'}
                </h2>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {currentWorkspace?.members_count || 1} team members
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* Workspace Dropdown */}
          {isWorkspaceMenuOpen && (
            <div className="absolute top-16 left-4 right-4 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 animate-fade-in">
              <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                Workspaces
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setCurrentWorkspace(ws);
                    setIsWorkspaceMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition ${
                    currentWorkspace?.id === ws.id
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-brand-500 shrink-0" />
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Core Navigation */}
          <div className="space-y-1">
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                activeView === 'dashboard'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => handleNavigate('tasks')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                activeView === 'tasks'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <CheckSquare className="w-4 h-4 shrink-0" />
              <span>My Tasks</span>
            </button>

            <button
              onClick={() => handleNavigate('team')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                activeView === 'team'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Team & Roles</span>
            </button>
          </div>

          {/* Projects List Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Projects
              </span>
              <button
                onClick={onOpenCreateProject}
                className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Create Project"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {projects.map((proj) => {
                const isSelected = currentProject?.id === proj.id && activeView === 'board';
                return (
                  <button
                    key={proj.id}
                    onClick={() => handleSelectProject(proj)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 font-bold border border-brand-200/50 dark:border-brand-800/50'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || '#6366F1' }}
                      />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {proj.key}
                    </span>
                  </button>
                );
              })}

              {projects.length === 0 && (
                <p className="text-xs text-slate-400 px-3 italic">No projects created yet</p>
              )}
            </div>
          </div>
        </div>

        {/* User Footer Profile & Settings */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between px-2 py-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={() => handleNavigate('settings')}
              className={`p-1.5 rounded-lg transition ${
                activeView === 'settings' ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar src={user?.avatar} name={user?.full_name || 'User'} size="sm" status="online" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.full_name || user?.username}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="Confirm Logout" maxWidth="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-900/50">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
            <p className="text-xs font-medium">Are you sure you want to log out of your session?</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsLogoutModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" icon={<LogOut className="w-4 h-4" />} onClick={logout}>
              Log Out
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
