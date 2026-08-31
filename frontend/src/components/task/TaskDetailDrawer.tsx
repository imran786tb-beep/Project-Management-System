import React, { useState, useEffect } from 'react';
import { Task, Subtask, Comment, Attachment, BoardColumn, User } from '../../types';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  CheckSquare, MessageSquare, Paperclip, Clock, Calendar, 
  Trash2, Plus, Smile, Send, Edit2, AlertCircle, CornerDownRight, Tag
} from 'lucide-react';
import { commentAPI, subtaskAPI, taskAPI } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

interface TaskDetailDrawerProps {
  task: Task | null;
  columns: BoardColumn[];
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: (taskId: number) => void;
  allUsers: User[];
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  columns,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  allUsers,
}) => {
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [description, setDescription] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const [subtasksState, setSubtasksState] = useState<Subtask[]>([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setDescription(task.description || '');
      setSubtasksState(task.subtasks || []);
      fetchComments();
    }
  }, [task]);

  const handleToggleAssignee = async (userId: number) => {
    if (!task) return;
    const currentAssignees = task.assignees || [];
    const newAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter((id) => id !== userId)
      : [...currentAssignees, userId];

    try {
      await taskAPI.update(task.id, { assignees: newAssignees });
      onTaskUpdated();
      addToast('Assignees Updated', 'Task assignments updated.', 'success');
    } catch (err) {
      addToast('Error', 'Failed to update assignees.', 'error');
    }
  };

  const fetchComments = async () => {
    if (!task) return;
    setIsLoadingComments(true);
    try {
      const res = await commentAPI.list(task.id);
      const listData = Array.isArray(res.data) ? res.data : ((res.data as any)?.results || []);
      setComments(listData);
    } catch (err) {
      console.error('Failed to load comments', err);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  if (!task) return null;

  const handleSaveDescription = async () => {
    try {
      await taskAPI.update(task.id, { description });
      setIsEditingDesc(false);
      onTaskUpdated();
      addToast('Success', 'Task description updated.', 'success');
    } catch (err) {
      addToast('Error', 'Failed to update description.', 'error');
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      const res = await subtaskAPI.create({
        task: task.id,
        title: newSubtaskTitle,
        is_completed: false,
      });
      setNewSubtaskTitle('');
      setSubtasksState((prev) => [...prev, res.data]);
      onTaskUpdated();
      addToast('Success', 'Subtask added.', 'success');
    } catch (err) {
      addToast('Error', 'Failed to add subtask.', 'error');
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    const updated = subtasksState.map((st) =>
      st.id === subtask.id ? { ...st, is_completed: !st.is_completed } : st
    );
    setSubtasksState(updated);

    try {
      await subtaskAPI.update(subtask.id, { is_completed: !subtask.is_completed });
      onTaskUpdated();
    } catch (err) {
      setSubtasksState(subtasksState);
      addToast('Error', 'Failed to update subtask.', 'error');
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    setSubtasksState((prev) => prev.filter((st) => st.id !== subtaskId));
    try {
      await subtaskAPI.delete(subtaskId);
      onTaskUpdated();
    } catch (err) {
      addToast('Error', 'Failed to delete subtask.', 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      await commentAPI.create({
        task: task.id,
        content: newCommentText,
        parent: replyToCommentId,
      });
      setNewCommentText('');
      setReplyToCommentId(null);
      await fetchComments();
      onTaskUpdated();
      addToast('Comment Posted', 'Your comment was published.', 'success');
    } catch (err) {
      addToast('Error', 'Failed to post comment.', 'error');
    }
  };

  const handleStatusChange = async (columnId: number) => {
    try {
      await taskAPI.move(task.id, columnId);
      onTaskUpdated();
      addToast('Task Moved', 'Task column status updated.', 'success');
    } catch (err) {
      addToast('Error', 'Failed to move task.', 'error');
    }
  };

  const handlePriorityChange = async (priority: string) => {
    try {
      await taskAPI.update(task.id, { priority });
      onTaskUpdated();
      addToast('Priority Updated', `Set priority to ${priority}`, 'success');
    } catch (err) {
      addToast('Error', 'Failed to update priority.', 'error');
    }
  };

  const handleDeleteTask = async () => {
    if (confirm(`Are you sure you want to delete task ${task.task_key}?`)) {
      try {
        await taskAPI.delete(task.id);
        onClose();
        onTaskDeleted(task.id);
        addToast('Task Deleted', 'Task permanently removed.', 'info');
      } catch (err) {
        addToast('Error', 'Failed to delete task.', 'error');
      }
    }
  };

  const subtaskProgress = task.subtask_stats.total > 0
    ? Math.round((task.subtask_stats.completed / task.subtask_stats.total) * 100)
    : 0;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="2xl" title={`${task.task_key} - ${task.title}`}>
      <div className="space-y-6">
        {/* Status & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
              <select
                value={task.column}
                onChange={(e) => handleStatusChange(parseInt(e.target.value, 10))}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</span>
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={handleDeleteTask}>
              Delete Task
            </Button>
          </div>
        </div>

        {/* Task Assignees & Dates Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assignees</span>
              <button
                onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Assign / Edit</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap min-h-[32px]">
              {task.assignees_detail.length > 0 ? (
                task.assignees_detail.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/60 dark:border-slate-700/60">
                    <Avatar src={u.avatar} name={u.full_name} size="xs" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{u.full_name}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No team members assigned</span>
              )}
            </div>

            {/* Interactive Assignee Toggle Dropdown */}
            {isAssigneeDropdownOpen && (
              <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 animate-fade-in">
                <span className="text-[10px] font-bold text-slate-400 uppercase px-2 block mb-1">Click to Assign / Unassign:</span>
                {allUsers.map((u) => {
                  const isAssigned = (task.assignees || []).includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleToggleAssignee(u.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition ${
                        isAssigned ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar src={u.avatar} name={u.full_name} size="xs" />
                        <span>{u.full_name}</span>
                      </div>
                      {isAssigned && <span className="text-xs font-bold text-brand-600">✓ Assigned</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Timeline</span>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-brand-500" />
              <span>Start: {task.start_date || 'Not set'}</span>
              <span>•</span>
              <span>Due: {task.due_date || 'Not set'}</span>
            </div>
          </div>
        </div>

        {/* Task Description */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-brand-500" />
              Description
            </h3>
            {!isEditingDesc && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditingDesc(true)}>
                Edit
              </Button>
            )}
          </div>

          {isEditingDesc ? (
            <div className="space-y-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="Add detailed task requirements..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsEditingDesc(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveDescription}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {task.description || 'No description provided.'}
            </p>
          )}
        </div>

        {/* Subtasks / Checklist */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          {(() => {
            const completedCount = subtasksState.filter((st) => st.is_completed).length;
            const totalCount = subtasksState.length;
            const calculatedProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-brand-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Subtask Checklist</h3>
                    <span className="text-xs text-slate-500">
                      ({completedCount}/{totalCount})
                    </span>
                  </div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{calculatedProgress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${calculatedProgress}%` }}
                  />
                </div>

                {/* Subtasks items */}
                <div className="space-y-2">
                  {subtasksState.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl group"
                    >
                      <label className="flex items-center gap-3 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={st.is_completed}
                          onChange={() => handleToggleSubtask(st)}
                          className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                        />
                        <span
                          className={`text-xs font-medium text-slate-800 dark:text-slate-200 truncate ${
                            st.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {st.title}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {subtasksState.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">No subtasks added yet.</p>
                  )}
                </div>
              </>
            );
          })()}

          {/* Add Subtask Form */}
          <form onSubmit={handleAddSubtask} className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add a new checklist item..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <Button type="submit" variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />}>
              Add
            </Button>
          </form>
        </div>

        {/* Comments & Activity Stream */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-500" />
            Activity & Discussion ({comments.length})
          </h3>

          {/* Comment input box */}
          <form onSubmit={handleAddComment} className="space-y-2">
            <div className="relative">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={3}
                placeholder="Write a comment... (use @name to mention team members)"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Supports markdown and mentions</span>
              <Button type="submit" variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                Post Comment
              </Button>
            </div>
          </form>

          {/* Comments list */}
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {comments.map((cmt) => (
              <div key={cmt.id} className="flex gap-3">
                <Avatar src={cmt.author_detail?.avatar} name={cmt.author_detail?.full_name || 'User'} size="sm" />
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {cmt.author_detail?.full_name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(cmt.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">{cmt.content}</p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4 italic">No comments yet. Start the conversation!</p>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
