import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, X, Loader2, FolderKanban, CheckSquare, Menu } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { useWebSocket } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Project, Task } from '../../types';

interface HeaderProps {
  currentProject: Project | null;
  projects?: Project[];
  tasks?: Task[];
  onOpenCreateTask: () => void;
  onSearchChange: (query: string) => void;
  onSelectProject?: (p: Project) => void;
  onSelectTask?: (t: Task) => void;
  taskCount?: number;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  projects = [],
  tasks = [],
  onOpenCreateTask,
  onSearchChange,
  onSelectProject,
  onSelectTask,
  taskCount,
  onToggleSidebar,
}) => {
  const { isConnected, onlineMembers } = useWebSocket();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // mobile search toggle
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Debounced search ─────────────────────────────────────────────────────
  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearchChange(value);
      }, 250);
    },
    [onSearchChange]
  );

  const clearSearch = () => {
    setSearchQuery('');
    onSearchChange('');
    setIsSearchOpen(false);
  };

  // Filter matching projects & tasks for Spotlight dropdown
  const queryClean = searchQuery.trim().toLowerCase();
  const matchingProjects = queryClean
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(queryClean) ||
          p.key.toLowerCase().includes(queryClean)
      )
    : [];

  const matchingTasks = queryClean
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(queryClean) ||
          (t.task_key || t.key || '').toLowerCase().includes(queryClean) ||
          t.description?.toLowerCase().includes(queryClean)
      )
    : [];

  // Keyboard shortcut: Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        clearSearch();
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Focus input when mobile search opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // ─── Real team presence ───────────────────────────────────────────────────
  let displayMembers = onlineMembers;
  if (displayMembers.length === 0 && currentUser) {
    displayMembers = [{ id: currentUser.id, user: currentUser, role: 'Owner' }] as any[];
  }
  const MAX_VISIBLE = 3;
  const visibleMembers = displayMembers.slice(0, MAX_VISIBLE);
  const extraCount = Math.max(0, displayMembers.length - MAX_VISIBLE);

  const SearchDropdown = () => (
    searchQuery.trim() !== '' && isSearchFocused ? (
      <div
        onMouseDown={(e) => e.preventDefault()}
        className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 animate-fade-in"
      >
        {/* Projects Category */}
        {matchingProjects.length > 0 && (
          <div className="p-2">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FolderKanban className="w-3 h-3 text-brand-500" />
              Projects ({matchingProjects.length})
            </div>
            {matchingProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelectProject?.(p);
                  clearSearch();
                  setIsSearchFocused(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded-xl hover:bg-brand-50/60 dark:hover:bg-brand-950/40 transition text-xs font-semibold text-slate-900 dark:text-slate-100 group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: p.color || '#6366F1' }}
                  />
                  <span className="group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                    {p.name}
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">
                  {p.key}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Tasks Category */}
        {matchingTasks.length > 0 && (
          <div className="p-2">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckSquare className="w-3 h-3 text-emerald-500" />
              Tasks ({matchingTasks.length})
            </div>
            {matchingTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTask?.(t);
                  clearSearch();
                  setIsSearchFocused(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded-xl hover:bg-brand-50/60 dark:hover:bg-brand-950/40 transition text-xs text-slate-900 dark:text-slate-100 group"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-800 shrink-0">
                    {t.task_key || t.key}
                  </span>
                  <span className="font-medium truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                    {t.title}
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md capitalize shrink-0">
                  {t.priority.toLowerCase()}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Empty state when no matches */}
        {matchingProjects.length === 0 && matchingTasks.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-400">
            <FolderKanban className="w-8 h-8 mx-auto mb-2 text-slate-400/40" />
            <p className="font-bold text-slate-700 dark:text-slate-300">
              No results found for "{searchQuery}"
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Try searching with a key prefix (e.g. {projects[0]?.key || 'APP'}) or project title
            </p>
          </div>
        )}
      </div>
    ) : null
  );

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-20">
      {/* Main header row */}
      <div className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Left: Hamburger (mobile) + Project title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Hamburger menu — mobile only */}
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition md:hidden shrink-0"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Project title / page title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {currentProject ? (
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: currentProject.color || '#6366F1' }}
                />
                <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate max-w-[120px] sm:max-w-xs">
                  {currentProject.name}
                </h1>
                <span className="hidden sm:inline px-2 py-0.5 text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md shrink-0">
                  {currentProject.key}
                </span>
              </div>
            ) : (
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Dashboard Overview
              </h1>
            )}

            {/* Live WebSocket indicator — hidden on small mobile */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Center: Spotlight Search — desktop */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search
              className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                isSearchFocused ? 'text-brand-500' : 'text-slate-400'
              }`}
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search projects & tasks…"
              className={`w-full bg-slate-100 dark:bg-slate-800/80 border text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-9 pr-16 py-2.5 focus:outline-none transition-all duration-200 ${
                isSearchFocused
                  ? 'border-brand-500 ring-2 ring-brand-500/20 bg-white dark:bg-slate-800'
                  : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery ? (
                <button
                  onClick={clearSearch}
                  className="p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                !isSearchFocused && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                    ⌘K
                  </span>
                )
              )}
            </div>
            <SearchDropdown />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 sm:gap-3 shrink-0">
          {/* Mobile search toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Team presence — active members in workspace */}
          {displayMembers.length > 0 && (
            <div
              className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700 shrink-0"
              title={`${displayMembers.length} active workspace member${displayMembers.length !== 1 ? 's' : ''}`}
            >
              <div className="flex -space-x-2">
                {visibleMembers.map((member, idx) => {
                  const memberUser = member.user || member;
                  const isYou = memberUser?.id === currentUser?.id;
                  const memberName = memberUser?.full_name || memberUser?.username || currentUser?.full_name || currentUser?.username || 'Member';
                  return (
                    <div
                      key={member.id || idx}
                      title={`${memberName}${isYou ? ' (You)' : ''} · ${member.role || 'Member'}`}
                      className="relative"
                    >
                      <Avatar
                        src={memberUser?.avatar}
                        name={memberName}
                        size="xs"
                        status="online"
                      />
                    </div>
                  );
                })}
                {extraCount > 0 && (
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-extrabold text-slate-600 dark:text-slate-300">
                    +{extraCount}
                  </div>
                )}
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                  {displayMembers.length} Active
                </span>
                <span className="text-[9px] text-slate-400 font-medium tracking-wide">
                  in workspace
                </span>
              </div>
            </div>
          )}

          <NotificationCenter />

          <button
            onClick={onOpenCreateTask}
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-1 sm:gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </div>

      {/* Mobile search bar — expands below header */}
      {isSearchOpen && (
        <div className="md:hidden px-3 pb-3 animate-fade-in">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-500" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search projects & tasks…"
              className="w-full bg-slate-100 dark:bg-slate-800 border border-brand-500 ring-2 ring-brand-500/20 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-9 pr-10 py-2.5 focus:outline-none"
            />
            {searchQuery ? (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Mobile search dropdown */}
            {searchQuery.trim() !== '' && isSearchFocused && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto animate-fade-in"
              >
                {matchingProjects.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Projects ({matchingProjects.length})
                    </div>
                    {matchingProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { onSelectProject?.(p); clearSearch(); setIsSearchFocused(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-brand-50/60 dark:hover:bg-brand-950/40 transition text-xs font-semibold text-slate-900 dark:text-slate-100"
                      >
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color || '#6366F1' }} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
                {matchingTasks.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Tasks ({matchingTasks.length})
                    </div>
                    {matchingTasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { onSelectTask?.(t); clearSearch(); setIsSearchFocused(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-brand-50/60 dark:hover:bg-brand-950/40 transition text-xs text-slate-900 dark:text-slate-100"
                      >
                        <span className="font-mono text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200 shrink-0">{t.task_key || t.key}</span>
                        <span className="truncate">{t.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {matchingProjects.length === 0 && matchingTasks.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">No results for "{searchQuery}"</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
