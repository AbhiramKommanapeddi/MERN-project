import React, { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import './TodoBoard.css';
import Header from './Header';
import { TaskColumn } from './TaskColumn';
import { TaskModal } from './TaskModal';
import { ActivityFeed } from './ActivityFeed';
import { User, Task, Activity } from '../types';
import { tasksAPI, activityAPI, authAPI } from '../services/api';

interface TodoBoardProps {
  user: User;
  socket: Socket | null;
  onLogout: () => void;
}

interface TasksByStatus {
  todo: Task[];
  'in-progress': Task[];
  done: Task[];
}

const TodoBoard: React.FC<TodoBoardProps> = ({ user, socket, onLogout }) => {
  const [tasks, setTasks] = useState<TasksByStatus>({
    todo: [],
    'in-progress': [],
    done: [],
  });
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load initial data
  useEffect(() => {
    loadTasks();
    loadUsers();
    loadActivities();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('task_created', handleTaskUpdate);
    socket.on('task_updated', handleTaskUpdate);
    socket.on('task_deleted', handleTaskDelete);
    socket.on('task_moved', handleTaskUpdate);
    socket.on('tasks_reordered', loadTasks);
    socket.on('new_activity', handleNewActivity);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('online_users', setOnlineUsers);
    socket.on('edit_started', handleEditStarted);
    socket.on('edit_ended', handleEditEnded);
    socket.on('conflict_detected', handleConflictDetected);

    return () => {
      socket.off('task_created');
      socket.off('task_updated');
      socket.off('task_deleted');
      socket.off('task_moved');
      socket.off('tasks_reordered');
      socket.off('new_activity');
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('online_users');
      socket.off('edit_started');
      socket.off('edit_ended');
      socket.off('conflict_detected');
    };
  }, [socket]);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getTasks();
      const tasksByStatus = response.data.tasks.reduce((acc, task) => {
        acc[task.status].push(task);
        return acc;
      }, { todo: [], 'in-progress': [], done: [] } as TasksByStatus);

      // Sort by order
      Object.keys(tasksByStatus).forEach(status => {
        tasksByStatus[status as keyof TasksByStatus].sort((a, b) => a.order - b.order);
      });

      setTasks(tasksByStatus);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await activityAPI.getActivities();
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const handleTaskUpdate = useCallback((data: { task: Task }) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      
      // Remove task from all columns
      Object.keys(newTasks).forEach(status => {
        newTasks[status as keyof TasksByStatus] = newTasks[status as keyof TasksByStatus]
          .filter(task => task._id !== data.task._id);
      });
      
      // Add task to correct column
      newTasks[data.task.status].push(data.task);
      
      // Sort by order
      Object.keys(newTasks).forEach(status => {
        newTasks[status as keyof TasksByStatus].sort((a, b) => a.order - b.order);
      });
      
      return newTasks;
    });
  }, []);

  const handleTaskDelete = useCallback((data: { taskId: string }) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(status => {
        newTasks[status as keyof TasksByStatus] = newTasks[status as keyof TasksByStatus]
          .filter(task => task._id !== data.taskId);
      });
      return newTasks;
    });
  }, []);

  const handleNewActivity = useCallback((activity: Activity) => {
    setActivities(prev => [activity, ...prev.slice(0, 19)]);
  }, []);

  const handleUserOnline = useCallback((data: { userId: string; username: string }) => {
    setOnlineUsers(prev => {
      if (!prev.find(u => u._id === data.userId)) {
        return [...prev, { _id: data.userId, username: data.username, email: '' } as User];
      }
      return prev;
    });
  }, []);

  const handleUserOffline = useCallback((data: { userId: string }) => {
    setOnlineUsers(prev => prev.filter(u => u._id !== data.userId));
  }, []);

  const handleEditStarted = useCallback((data: { taskId: string; editedBy: string }) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(status => {
        newTasks[status as keyof TasksByStatus] = newTasks[status as keyof TasksByStatus].map(task =>
          task._id === data.taskId
            ? { ...task, isBeingEdited: true, editedBy: { username: data.editedBy } as User }
            : task
        );
      });
      return newTasks;
    });
  }, []);

  const handleEditEnded = useCallback((data: { taskId: string }) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(status => {
        newTasks[status as keyof TasksByStatus] = newTasks[status as keyof TasksByStatus].map(task =>
          task._id === data.taskId
            ? { ...task, isBeingEdited: false, editedBy: undefined }
            : task
        );
      });
      return newTasks;
    });
  }, []);

  const handleConflictDetected = useCallback((data: { taskId: string; conflictUsers: string[] }) => {
    // Show conflict notification
    console.warn('Edit conflict detected:', data);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTask(active.id as string);
    setDraggedTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    const activeTask = findTask(activeId);
    if (!activeTask) return;
    
    const activeStatus = activeTask.status;
    const overStatus = overId.includes('-') ? overId.split('-')[0] : overId;
    
    if (activeStatus !== overStatus) {
      setTasks(prev => {
        const newTasks = { ...prev };
        
        // Remove from old column
        newTasks[activeStatus] = newTasks[activeStatus].filter(task => task._id !== activeId);
        
        // Add to new column
        const updatedTask = { ...activeTask, status: overStatus as Task['status'] };
        newTasks[overStatus as keyof TasksByStatus].push(updatedTask);
        
        return newTasks;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    const activeTask = findTask(activeId);
    if (!activeTask) return;
    
    const overStatus = overId.includes('-') ? overId.split('-')[0] : overId;
    
    try {
      // Update task status if changed
      if (activeTask.status !== overStatus) {
        await tasksAPI.updateTask(activeId, { status: overStatus as Task['status'] });
        socket?.emit('task_moved', { taskId: activeId, newStatus: overStatus });
      }
      
      // Handle reordering within the same column
      const tasksInColumn = tasks[overStatus as keyof TasksByStatus];
      const reorderedTasks = tasksInColumn.map((task, index) => ({
        id: task._id,
        status: overStatus,
        order: index,
      }));
      
      await tasksAPI.reorderTasks(reorderedTasks);
      socket?.emit('tasks_reordered', { tasks: reorderedTasks });
      
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert changes on error
      loadTasks();
    }
  };

  const findTask = (id: string): Task | null => {
    for (const status of Object.keys(tasks)) {
      const task = tasks[status as keyof TasksByStatus].find(task => task._id === id);
      if (task) return task;
    }
    return null;
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = async (task: Task) => {
    try {
      await tasksAPI.startEdit(task._id);
      setEditingTask(task);
      setShowTaskModal(true);
      socket?.emit('edit_started', { taskId: task._id });
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert(`Task is being edited by ${error.response.data.editedBy}`);
      }
    }
  };

  const handleCloseModal = () => {
    if (editingTask) {
      tasksAPI.endEdit(editingTask._id);
      socket?.emit('edit_ended', { taskId: editingTask._id });
    }
    setEditingTask(null);
    setShowTaskModal(false);
  };

  const handleTaskSubmit = async (taskData: any) => {
    try {
      if (editingTask) {
        await tasksAPI.updateTask(editingTask._id, taskData);
        socket?.emit('task_updated', { taskId: editingTask._id, updates: taskData });
      } else {
        const response = await tasksAPI.createTask(taskData);
        socket?.emit('task_created', { task: response.data.task });
      }
      handleCloseModal();
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.deleteTask(taskId);
        socket?.emit('task_deleted', { taskId });
        loadTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleSmartAssign = async (taskId: string) => {
    try {
      const response = await tasksAPI.smartAssign(taskId);
      socket?.emit('task_smart_assigned', { task: response.data.task });
      loadTasks();
    } catch (error) {
      console.error('Error smart assigning task:', error);
    }
  };

  if (loading) {
    return (
      <div className="board-loading">
        <div className="spinner"></div>
        <p>Loading your board...</p>
      </div>
    );
  }

  return (
    <div className="todo-board">
      <Header 
        user={user}
        onlineUsers={onlineUsers}
        onToggleActivity={() => setShowActivityFeed(!showActivityFeed)}
        showActivity={showActivityFeed}
        onLogout={onLogout}
      />
      
      <div className="board-content">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="board-columns">
            {(['todo', 'in-progress', 'done'] as const).map(status => (
              <SortableContext
                key={status}
                items={tasks[status].map(task => task._id)}
                strategy={verticalListSortingStrategy}
              >
                <TaskColumn
                  id={status}
                  title={status === 'todo' ? 'To Do' : status === 'in-progress' ? 'In Progress' : 'Done'}
                  tasks={tasks[status]}
                  users={users}
                  currentUser={user}
                  onTaskClick={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onSmartAssign={handleSmartAssign}
                />
              </SortableContext>
            ))}
          </div>
        </DndContext>
      </div>

      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          task={editingTask}
          users={users}
          currentUser={user}
          onSave={handleTaskSubmit}
          onClose={handleCloseModal}
        />
      )}

      {showActivityFeed && (
        <ActivityFeed
          activities={activities}
          isVisible={showActivityFeed}
          onClose={() => setShowActivityFeed(false)}
        />
      )}
    </div>
  );
};

export default TodoBoard;
