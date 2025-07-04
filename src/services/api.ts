// API service for making HTTP requests to the backend
import axios from 'axios';
import { User, Task, Activity, AuthResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Additional response interfaces for API responses
export interface TaskResponse {
  task: Task;
  message: string;
}

export interface TasksResponse {
  tasks: Task[];
}

export interface ActivitiesResponse {
  activities: Activity[];
}

export interface UsersResponse {
  users: User[];
}

// Auth API
export const authAPI = {
  register: (userData: { username: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', userData),
  
  login: (credentials: { username: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', credentials),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getMe: () =>
    api.get<{ user: User }>('/auth/me'),
  
  getUsers: () =>
    api.get<UsersResponse>('/auth/users'),
};

// Tasks API
export const tasksAPI = {
  getTasks: () =>
    api.get<TasksResponse>('/tasks'),
  
  createTask: (taskData: { title: string; description: string; assignedTo: string; priority: string }) =>
    api.post<TaskResponse>('/tasks', taskData),
  
  updateTask: (id: string, updates: Partial<Task>) =>
    api.put<TaskResponse>(`/tasks/${id}`, updates),
  
  deleteTask: (id: string) =>
    api.delete(`/tasks/${id}`),
  
  smartAssign: (id: string) =>
    api.post<TaskResponse>(`/tasks/${id}/smart-assign`),
  
  startEdit: (id: string) =>
    api.post(`/tasks/${id}/start-edit`),
  
  endEdit: (id: string) =>
    api.post(`/tasks/${id}/end-edit`),
  
  reorderTasks: (tasks: Array<{ id: string; status: string; order: number }>) =>
    api.post('/tasks/reorder', { tasks }),
};

// Activity API
export const activityAPI = {
  getActivities: () =>
    api.get<ActivitiesResponse>('/activity'),
  
  getTaskActivities: (taskId: string) =>
    api.get<ActivitiesResponse>(`/activity/task/${taskId}`),
  
  getUserActivities: (userId: string) =>
    api.get<ActivitiesResponse>(`/activity/user/${userId}`),
};

export default api;
