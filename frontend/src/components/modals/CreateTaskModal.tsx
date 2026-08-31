import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { BoardColumn, Project, Priority, User } from '../../types';
import { taskAPI } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { useWebSocket } from '../../context/WebSocketContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  columns: BoardColumn[];
  defaultColumnId?: number;
  onTaskCreated: () => void;
  allUsers: User[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  project,
  columns,
  defaultColumnId,
  onTaskCreated,
  allUsers,
}) => {
  const { addToast } = useNotifications();
  const { sendMessage } = useWebSocket();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState<number>(defaultColumnId || (columns[0]?.id || 0));
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [storyPoints, setStoryPoints] = useState(3);
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (defaultColumnId) setColumnId(defaultColumnId);
    else if (columns.length > 0) setColumnId(columns[0].id);
  }, [defaultColumnId, columns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !columnId) return;
    setIsLoading(true);

    try {
      const res = await taskAPI.create({
        project: project.id,
        column: columnId,
        title,
        description,
        priority,
        due_date: dueDate || null,
        story_points: storyPoints,
        assignees: selectedAssignees,
      });

      // Broadcast WebSocket live update
      sendMessage({
        type: 'task_created',
        task: res.data,
      });

      addToast('Task Created', `Created task '${title}'`, 'success');
      onTaskCreated();
      onClose();
      setTitle('');
      setDescription('');
    } catch (err) {
      addToast('Error', 'Failed to create task.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Create Task in ${project?.name || 'Project'}`} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Implement WebSockets auth token refresh"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Column / Status</label>
            <select
              value={columnId}
              onChange={(e) => setColumnId(parseInt(e.target.value, 10))}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Input
            label="Story Points"
            type="number"
            value={storyPoints}
            onChange={(e) => setStoryPoints(parseInt(e.target.value, 10))}
            min={1}
            max={13}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add task acceptance criteria..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
