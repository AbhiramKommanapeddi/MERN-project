// Shared type definitions for the application

export interface User {
  _id: string;
  username: string;
  email: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  assignedTo?: string;
  assignedUser?: {
    _id: string;
    username: string;
  };
  priority: 'low' | 'medium' | 'high';
  createdBy: {
    _id: string;
    username: string;
  };
  position: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  isLocked?: boolean;
  lockedBy?: {
    _id: string;
    username: string;
  };
}

export interface Activity {
  _id: string;
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_moved' | 'user_joined' | 'user_left';
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'unassigned' | 'status_changed' | 'priority_changed';
  user: User;
  task?: Task;
  taskId?: string;
  taskTitle?: string;
  userId?: string;
  username?: string;
  timestamp: string;
  details?: {
    assignedTo?: string;
    oldStatus?: string;
    newStatus?: string;
    oldPriority?: string;
    newPriority?: string;
    changes?: Record<string, any>;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  status?: number;
}
