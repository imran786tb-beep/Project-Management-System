import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, BoardColumn } from '../../types';
import { Plus, MoreHorizontal, MessageSquare, Paperclip, Calendar, CheckSquare, Sparkles } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

interface KanbanViewProps {
  columns: BoardColumn[];
  tasks: Task[];
  onTaskMove: (taskId: number, newColumnId: number, newIndex: number) => void;
  onSelectTask: (task: Task) => void;
  onOpenCreateTaskInColumn: (columnId: number) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  columns,
  tasks,
  onTaskMove,
  onSelectTask,
  onOpenCreateTaskInColumn,
}) => {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = parseInt(draggableId, 10);
    const newColumnId = parseInt(destination.droppableId, 10);
    onTaskMove(taskId, newColumnId, destination.index);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-5 h-full overflow-x-auto pb-4 items-start select-none">
        {columns.map((column) => {
          const columnTasks = tasks
            .filter((t) => t.column === column.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={column.id}
              className="w-80 shrink-0 bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col max-h-full overflow-hidden shadow-xs"
            >
              {/* Column Header */}
              <div className="p-3.5 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: column.color || '#3B82F6' }}
                  />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
                    {column.name}
                  </h3>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onOpenCreateTaskInColumn(column.id)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Add card"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Droppable Task List */}
              <Droppable droppableId={column.id.toString()}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''
                    }`}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onSelectTask(task)}
                            className={`p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all group cursor-pointer ${
                              snapshot.isDragging ? 'shadow-2xl rotate-1 scale-102 ring-2 ring-brand-500 z-50' : ''
                            }`}
                          >
                            {/* Card Header: Labels & Key */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {task.labels_detail.map((lbl) => (
                                  <span
                                    key={lbl.id}
                                    className="px-2 py-0.5 text-[10px] font-bold rounded-md text-white shadow-2xs"
                                    style={{ backgroundColor: lbl.color }}
                                  >
                                    {lbl.name}
                                  </span>
                                ))}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 font-semibold">
                                {task.task_key}
                              </span>
                            </div>

                            {/* Card Title */}
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug mb-2 line-clamp-2">
                              {task.title}
                            </h4>

                            {/* Card Footer: Priority, Dates, Counts, Assignees */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-2">
                                <Badge priority={task.priority}>{task.priority}</Badge>
                                {task.due_date && (
                                  <div className="flex items-center gap-1 text-[10px]">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>{new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {task.comment_count > 0 && (
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-semibold">{task.comment_count}</span>
                                  </div>
                                )}
                                {task.subtask_stats.total > 0 && (
                                  <div className="flex items-center gap-1">
                                    <CheckSquare className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-semibold">
                                      {task.subtask_stats.completed}/{task.subtask_stats.total}
                                    </span>
                                  </div>
                                )}
                                <div className="flex -space-x-1.5 overflow-hidden ml-1">
                                  {task.assignees_detail.map((user) => (
                                    <Avatar key={user.id} src={user.avatar} name={user.full_name} size="xs" />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Add Task Button at column bottom */}
              <div className="p-2.5 border-t border-slate-200/50 dark:border-slate-800/60">
                <button
                  onClick={() => onOpenCreateTaskInColumn(column.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Card</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
