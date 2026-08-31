import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { projectAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { FolderKanban } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { currentWorkspace, workspaces } = useAuth();
  const { addToast } = useNotifications();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [isKeyEdited, setIsKeyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [isLoading, setIsLoading] = useState(false);

  const colors = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const generateProjectKey = (val: string): string => {
    if (!val.trim()) return '';
    const words = val.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      // Acronym for multi-word names: "App Development" -> "AD"
      return words.map((w) => w[0]).join('').substring(0, 4).toUpperCase();
    }
    // Uppercase 3-letter prefix for single word: "Development" -> "DEV"
    return val.trim().replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isKeyEdited) {
      setKey(generateProjectKey(val));
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKey(e.target.value.toUpperCase());
    setIsKeyEdited(true);
  };

  const resetForm = () => {
    setName('');
    setKey('');
    setIsKeyEdited(false);
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const wsId = currentWorkspace?.id || (workspaces.length > 0 ? workspaces[0].id : 1);
    setIsLoading(true);

    try {
      await projectAPI.create({
        workspace: wsId,
        name,
        key: key.toUpperCase() || generateProjectKey(name),
        description,
        color,
      });
      addToast('Project Created', `Project '${name}' created successfully.`, 'success');
      onProjectCreated();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Project creation error:', err);
      const errMsg = err.response?.data?.detail || err.response?.data?.workspace?.[0] || err.response?.data?.key?.[0] || 'Failed to create project.';
      addToast('Error', errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose(); }} title="Create New Project" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          value={name}
          onChange={handleNameChange}
          placeholder="e.g. Mobile App V2"
          required
        />

        <Input
          label="Project Key Prefix"
          value={key}
          onChange={handleKeyChange}
          placeholder="e.g. AD, MOB, PRJ"
          maxLength={6}
          required
        />

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief project goals..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Accent Color</label>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition ${
                  color === c ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
