import React, { useState, useEffect } from 'react';
import { WorkspaceMember, WorkspaceRole } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { UserPlus, Shield, Mail, CheckCircle2, Edit3, Save, Lock, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { workspaceAPI } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

interface TeamViewProps {
  onOpenInviteModal: () => void;
  refreshTrigger?: number;
}

export const TeamView: React.FC<TeamViewProps> = ({ onOpenInviteModal, refreshTrigger }) => {
  const { currentWorkspace, user: currentUser } = useAuth();
  const { addToast } = useNotifications();

  const [teamMembers, setTeamMembers] = useState<WorkspaceMember[]>([]);
  const [editingJobTitleId, setEditingJobTitleId] = useState<number | null>(null);
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [loadingRoleId, setLoadingRoleId] = useState<number | null>(null);

  // Derive current user's workspace role from the workspace object
  const myRole: WorkspaceRole = (currentWorkspace?.my_role ?? 'MEMBER') as WorkspaceRole;
  const isOwner = myRole === 'OWNER';
  const isAdminOrOwner = myRole === 'OWNER' || myRole === 'ADMIN';

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchMembers();
    }
  }, [currentWorkspace?.id, refreshTrigger]);

  const fetchMembers = async () => {
    if (!currentWorkspace?.id) return;
    try {
      const res = await workspaceAPI.getMembers(currentWorkspace.id);
      const list: WorkspaceMember[] = Array.isArray(res.data)
        ? res.data
        : (res.data as any)?.results || [];
      setTeamMembers(list);
    } catch {
      addToast('Error', 'Failed to load team members.', 'error');
    }
  };

  const handleRoleChange = async (member: WorkspaceMember, newRole: WorkspaceRole) => {
    if (!currentWorkspace?.id) return;

    // Guard: only OWNER can assign OWNER role
    if (newRole === 'OWNER' && !isOwner) {
      addToast('Permission Denied', 'Only the workspace Owner can assign the Owner role.', 'error');
      return;
    }

    // Guard: prevent demoting the sole owner on the frontend
    if (member.role === 'OWNER' && newRole !== 'OWNER') {
      const ownerCount = teamMembers.filter((m) => m.role === 'OWNER').length;
      if (ownerCount <= 1) {
        addToast(
          'Action Blocked',
          'Cannot demote the sole Owner. Assign another Owner first.',
          'error'
        );
        return;
      }
    }

    setLoadingRoleId(member.user.id);
    try {
      await workspaceAPI.addMember(currentWorkspace.id, {
        user_id: member.user.id,
        role: newRole,
      });
      setTeamMembers((prev) =>
        prev.map((m) => (m.user.id === member.user.id ? { ...m, role: newRole } : m))
      );
      addToast(
        'Role Updated',
        `${member.user.full_name || member.user.username}'s role changed to ${newRole}.`,
        'success'
      );
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to update role.';
      addToast('Permission Denied', detail, 'error');
    } finally {
      setLoadingRoleId(null);
    }
  };

  const handleSaveJobTitle = async (member: WorkspaceMember) => {
    if (!jobTitleInput.trim()) {
      setEditingJobTitleId(null);
      return;
    }
    // Only the user themselves can update their own job title
    if (member.user.id !== currentUser?.id) {
      addToast('Permission Denied', 'You can only edit your own job title.', 'error');
      setEditingJobTitleId(null);
      return;
    }
    try {
      const { authAPI } = await import('../../services/api');
      await authAPI.updateProfile({ job_title: jobTitleInput });
      setTeamMembers((prev) =>
        prev.map((m) =>
          m.user.id === member.user.id
            ? { ...m, user: { ...m.user, job_title: jobTitleInput } }
            : m
        )
      );
      setEditingJobTitleId(null);
      addToast('Job Title Updated', 'Your job title has been saved.', 'success');
    } catch {
      addToast('Error', 'Failed to save job title.', 'error');
    }
  };

  const handleRemoveMember = async (member: WorkspaceMember) => {
    if (!currentWorkspace?.id) return;
    if (member.user.id === currentUser?.id) {
      addToast('Action Blocked', 'You cannot remove yourself from the workspace.', 'error');
      return;
    }
    if (member.role === 'OWNER') {
      const ownerCount = teamMembers.filter((m) => m.role === 'OWNER').length;
      if (ownerCount <= 1) {
        addToast('Action Blocked', 'Cannot remove the sole workspace Owner.', 'error');
        return;
      }
    }
    if (!window.confirm(`Are you sure you want to remove ${member.user.full_name || member.user.username} from ${currentWorkspace.name}?`)) {
      return;
    }

    try {
      await workspaceAPI.removeMember(currentWorkspace.id, member.user.id);
      setTeamMembers((prev) => prev.filter((m) => m.user.id !== member.user.id));
      addToast('Member Removed', `Removed ${member.user.full_name || member.user.username} from workspace.`, 'success');
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to remove member.';
      addToast('Error', detail, 'error');
    }
  };

  const roleBadgeVariant = (role: WorkspaceRole) => {
    if (role === 'OWNER') return 'primary';
    if (role === 'ADMIN') return 'warning';
    return 'default';
  };

  const roleOptions: { value: WorkspaceRole; label: string }[] = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MEMBER', label: 'Member' },
    { value: 'VIEWER', label: 'Viewer' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {currentWorkspace?.name || 'Workspace'} Team Members ({teamMembers.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAdminOrOwner
              ? 'Manage roles and permissions for your workspace members.'
              : 'View your team members and their roles in this workspace.'}
          </p>
        </div>
        {/* Only OWNER/ADMIN can invite */}
        {isAdminOrOwner && (
          <Button
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={onOpenInviteModal}
          >
            Invite Member
          </Button>
        )}
      </div>

      {/* Permission notice for regular members */}
      {!isAdminOrOwner && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            Only workspace <strong>Owners</strong> and <strong>Admins</strong> can manage roles or
            invite members. You may only edit your own job title.
          </span>
        </div>
      )}

      {/* Member List — Cards on mobile, Table on desktop */}
      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {teamMembers.map((m) => {
          const isSelf = m.user.id === currentUser?.id;
          const isEditingTitle = editingJobTitleId === m.user.id;
          const isThisOwner = m.role === 'OWNER';
          const canChangeThisRole = isAdminOrOwner && !(isThisOwner && !isOwner);

          return (
            <div
              key={m.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs"
            >
              {/* Member header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={m.user.avatar} name={m.user.full_name || m.user.username} size="md" status="online" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{m.user.full_name || m.user.username}</h4>
                      {isSelf && (
                        <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-md">You</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                    <CheckCircle2 className="w-3 h-3" />Active
                  </span>
                  {isAdminOrOwner && !isSelf && (!isThisOwner || isOwner) && (
                    <button
                      onClick={() => handleRemoveMember(m)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Job title */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Job Title</span>
                {isEditingTitle && isSelf ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={jobTitleInput}
                      onChange={(e) => setJobTitleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveJobTitle(m)}
                      placeholder="e.g. Full Stack Engineer"
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-brand-500 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                      autoFocus
                    />
                    <button onClick={() => handleSaveJobTitle(m)} className="p-1 text-emerald-600 hover:text-emerald-500 transition">
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{m.user.job_title || 'Not set'}</span>
                    {isSelf && (
                      <button
                        onClick={() => { setEditingJobTitleId(m.user.id); setJobTitleInput(m.user.job_title || ''); }}
                        className="text-slate-400 hover:text-brand-500 transition p-0.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Role</span>
                {canChangeThisRole ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={m.role}
                      disabled={loadingRoleId === m.user.id}
                      onChange={(e) => handleRoleChange(m, e.target.value as WorkspaceRole)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 cursor-pointer disabled:opacity-50"
                    >
                      {roleOptions.filter((opt) => isOwner || opt.value !== 'OWNER').map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <Badge variant={roleBadgeVariant(m.role)}><Shield className="w-3 h-3 mr-1" />{m.role}</Badge>
                  </div>
                ) : (
                  <Badge variant={roleBadgeVariant(m.role)}><Shield className="w-3 h-3 mr-1" />{m.role}</Badge>
                )}
              </div>
            </div>
          );
        })}
        {teamMembers.length === 0 && (
          <p className="text-xs text-slate-400 italic text-center py-6">No members found.</p>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6">Member</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Job Title</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Status</th>
                {isAdminOrOwner && <th className="py-4 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {teamMembers.map((m) => {
                const isSelf = m.user.id === currentUser?.id;
                const isEditingTitle = editingJobTitleId === m.user.id;
                const isThisOwner = m.role === 'OWNER';
                const canChangeThisRole = isAdminOrOwner && !(isThisOwner && !isOwner);

                return (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar src={m.user.avatar} name={m.user.full_name || m.user.username} size="md" status="online" />
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                            {m.user.full_name || m.user.username}
                            {isSelf && <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-md">You</span>}
                          </h4>
                          <span className="text-[11px] text-slate-400">@{m.user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{m.user.email}</div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                      {isEditingTitle && isSelf ? (
                        <div className="flex items-center gap-2">
                          <input type="text" value={jobTitleInput} onChange={(e) => setJobTitleInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveJobTitle(m)} placeholder="e.g. Full Stack Engineer" className="bg-slate-50 dark:bg-slate-800 border border-brand-500 rounded-lg px-2.5 py-1 text-xs focus:outline-none w-40" autoFocus />
                          <button onClick={() => handleSaveJobTitle(m)} className="p-1 text-emerald-600 hover:text-emerald-500 transition"><Save className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span>{m.user.job_title || 'Not set'}</span>
                          {isSelf && <button onClick={() => { setEditingJobTitleId(m.user.id); setJobTitleInput(m.user.job_title || ''); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-brand-500 transition p-1"><Edit3 className="w-3.5 h-3.5" /></button>}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {canChangeThisRole ? (
                        <div className="flex items-center gap-2">
                          <select value={m.role} disabled={loadingRoleId === m.user.id} onChange={(e) => handleRoleChange(m, e.target.value as WorkspaceRole)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 cursor-pointer disabled:opacity-50">
                            {roleOptions.filter((opt) => isOwner || opt.value !== 'OWNER').map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                          <Badge variant={roleBadgeVariant(m.role)}><Shield className="w-3 h-3 mr-1" />{m.role}</Badge>
                        </div>
                      ) : (
                        <Badge variant={roleBadgeVariant(m.role)}><Shield className="w-3 h-3 mr-1" />{m.role}</Badge>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" />Active</span>
                    </td>
                    {isAdminOrOwner && (
                      <td className="py-4 px-6 text-right">
                        {!isSelf && (!isThisOwner || isOwner) ? (
                          <button onClick={() => handleRemoveMember(m)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
