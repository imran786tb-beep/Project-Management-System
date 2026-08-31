import axios from 'axios';
import { 
  User, Workspace, Project, BoardColumn, Task, 
  Comment, Notification, ActivityLog, Label, Subtask 
} from '../types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulse_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor for auto token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('pulse_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh/`, { refresh: refreshToken });
          localStorage.setItem('pulse_access_token', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('pulse_access_token');
          localStorage.removeItem('pulse_refresh_token');
          localStorage.removeItem('pulse_user');
          window.location.href = '#login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (data: any) => api.post('/auth/login/', data),
  register: (data: any) => api.post('/auth/register/', data),
  getMe: () => api.get<User>('/auth/me/'),
  updateProfile: (data: any) => api.patch<User>('/auth/me/', data),
  getUsers: () => api.get<User[]>('/auth/users/'),
};

// Workspace endpoints
export const workspaceAPI = {
  list: () => api.get<Workspace[]>('/workspaces/'),
  get: (id: number) => api.get<Workspace>(`/workspaces/${id}/`),
  create: (data: any) => api.post<Workspace>('/workspaces/', data),
  update: (id: number, data: any) => api.patch<Workspace>(`/workspaces/${id}/`, data),
  delete: (id: number) => api.delete(`/workspaces/${id}/`),
  getMembers: (id: number) => api.get(`/workspaces/${id}/members/`),
  addMember: (id: number, data: any) => api.post(`/workspaces/${id}/members/`, data),
  removeMember: (id: number, userId: number) => api.delete(`/workspaces/${id}/members/${userId}/`),
  inviteMember: (id: number, data: any) => api.post(`/workspaces/${id}/invite/`, data),
};

// Project endpoints
export const projectAPI = {
  list: (workspaceId?: number) => api.get<Project[]>(`/projects/${workspaceId ? `?workspace_id=${workspaceId}` : ''}`),
  get: (id: number) => api.get<Project>(`/projects/${id}/`),
  create: (data: any) => api.post<Project>('/projects/', data),
  update: (id: number, data: any) => api.patch<Project>(`/projects/${id}/`, data),
  delete: (id: number) => api.delete(`/projects/${id}/`),
  getColumns: (projectId: number) => api.get<BoardColumn[]>(`/projects/${projectId}/columns/`),
  createColumn: (projectId: number, data: any) => api.post<BoardColumn>(`/projects/${projectId}/columns/`, data),
};

// Column endpoints
export const columnAPI = {
  update: (id: number, data: any) => api.patch<BoardColumn>(`/projects/columns/${id}/`, data),
  delete: (id: number) => api.delete(`/projects/columns/${id}/`),
};

// Task endpoints
export const taskAPI = {
  list: (params?: any) => api.get<Task[]>('/tasks/', { params }),
  get: (id: number) => api.get<Task>(`/tasks/${id}/`),
  create: (data: any) => api.post<Task>('/tasks/', data),
  update: (id: number, data: any) => api.patch<Task>(`/tasks/${id}/`, data),
  delete: (id: number) => api.delete(`/tasks/${id}/`),
  move: (id: number, column_id: number, order?: number) => api.post<Task>(`/tasks/${id}/move/`, { column_id, order }),
};

// Subtask endpoints
export const subtaskAPI = {
  create: (data: any) => api.post<Subtask>('/tasks/subtasks/', data),
  update: (id: number, data: any) => api.patch<Subtask>(`/tasks/subtasks/${id}/`, data),
  delete: (id: number) => api.delete(`/tasks/subtasks/${id}/`),
};

// Label endpoints
export const labelAPI = {
  list: () => api.get<Label[]>('/tasks/labels/'),
  create: (data: any) => api.post<Label>('/tasks/labels/', data),
};

// Collaboration endpoints
export const commentAPI = {
  list: (taskId: number) => api.get<Comment[]>(`/collaboration/comments/?task=${taskId}`),
  create: (data: any) => api.post<Comment>('/collaboration/comments/', data),
  update: (id: number, data: any) => api.patch<Comment>(`/collaboration/comments/${id}/`, data),
  delete: (id: number) => api.delete(`/collaboration/comments/${id}/`),
};

export const reactionAPI = {
  create: (data: any) => api.post('/collaboration/reactions/', data),
};

export const activityAPI = {
  list: (projectId?: number) => api.get<ActivityLog[]>(`/collaboration/activity/${projectId ? `?project=${projectId}` : ''}`),
};

// Notification endpoints
export const notificationAPI = {
  list: () => api.get<Notification[]>('/notifications/'),
  markRead: (id: number) => api.post(`/notifications/${id}/mark-read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
};
