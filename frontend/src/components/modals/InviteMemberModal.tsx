import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { workspaceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Mail, Shield } from 'lucide-react';
import { WorkspaceRole } from '../../types';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberInvited?: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, onMemberInvited }) => {
  const { currentWorkspace, refreshWorkspaces } = useAuth();
  const { addToast } = useNotifications();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !email.trim()) return;
    setIsLoading(true);

    try {
      await workspaceAPI.inviteMember(currentWorkspace.id, { email, role });
      addToast('Invitation Sent', `Sent workspace invitation to ${email}`, 'success');
      await refreshWorkspaces();
      onMemberInvited?.();
      setEmail('');
      onClose();
    } catch (err: any) {
      addToast('Invite Error', err.response?.data?.detail || 'Failed to send invitation.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invite Team Member to ${currentWorkspace?.name || 'Workspace'}`} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Member Email Address"
          type="email"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@company.com"
          required
        />

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Assign Workspace Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as WorkspaceRole)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="MEMBER">Member (Can edit tasks & projects)</option>
            <option value="ADMIN">Admin (Can manage settings & invite)</option>
            <option value="VIEWER">Viewer (Read-only access)</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
