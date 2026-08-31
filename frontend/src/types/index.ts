export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type ViewMode = 'kanban' | 'list' | 'calendar' | 'timeline';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  avatar?: string;
  job_title?: string;
  bio?: string;
  dark_mode: boolean;
  created_at?: string;
}

export interface WorkspaceMember {
  id: number;
  workspace: number;
  user: User;
  role: WorkspaceRole;
  joined_at: string;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  description?: string;
  owner: User;
  icon: string;
  members_count: number;
  my_role?: WorkspaceRole;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceInvitation {
  id: number;
  workspace: number;
  workspace_name: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  invited_by: User;
  created_at: string;
}

export interface BoardColumn {
  id: number;
  project: number;
  name: string;
  color: string;
  order: number;
  is_default: boolean;
  task_count: number;
  created_at: string;
}

export interface ProjectMember {
  id: number;
  project: number;
  user: User;
  role: ProjectRole;
  joined_at: string;
}

export interface Project {
  id: number;
  workspace: number;
  name: string;
  key: string;
  description?: string;
  color: string;
  icon: string;
  is_archived: boolean;
  members_count: number;
  columns: BoardColumn[];
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: number;
  project: number;
  name: string;
  color: string;
}

export interface Subtask {
  id: number;
  task: number;
  title: string;
  is_completed: boolean;
  assignee?: number;
  assignee_detail?: User;
  due_date?: string;
  order: number;
  created_at: string;
}

export interface TaskDependency {
  id: number;
  task: number;
  depends_on: number;
  depends_on_key: string;
  depends_on_title: string;
  dependency_type: 'BLOCKS' | 'BLOCKED_BY';
}

export interface Attachment {
  id: number;
  task: number;
  file?: string;
  file_url?: string;
  file_name: string;
  file_size: number;
  file_type?: string;
  uploaded_by?: number;
  uploaded_by_detail?: User;
  uploaded_at: string;
}

export interface Task {
  id: number;
  project: number;
  project_name: string;
  project_key: string;
  column: number;
  column_name: string;
  column_color: string;
  task_number: number;
  task_key: string;
  key?: string;
  title: string;
  description?: string;
  priority: Priority;
  start_date?: string;
  due_date?: string;
  story_points: number;
  order: number;
  is_archived: boolean;
  creator?: number;
  creator_detail?: User;
  assignees: number[];
  assignees_detail: User[];
  labels: number[];
  labels_detail: Label[];
  subtasks: Subtask[];
  subtask_stats: { total: number; completed: number };
  comment_count: number;
  attachment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Reaction {
  id: number;
  comment?: number;
  task?: number;
  user: number;
  user_detail: User;
  emoji: string;
  created_at: string;
}

export interface Comment {
  id: number;
  task: number;
  author: number;
  author_detail: User;
  content: string;
  parent?: number;
  mentions: number[];
  mentions_detail: User[];
  reactions: Reaction[];
  replies_count: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  project: number;
  task?: number;
  user: number;
  user_detail?: User;
  action_type: string;
  description: string;
  created_at: string;
}

export interface Notification {
  id: number;
  recipient: number;
  sender?: number;
  sender_detail?: User;
  verb: 'ASSIGNED' | 'MENTIONED' | 'COMMENTED' | 'DUE_SOON' | 'INVITED' | 'STATUS_CHANGED';
  target_type: string;
  target_id?: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}
