import React, { useState, useEffect } from 'react';
import { Task, User } from '../types';
import './TaskModal.css';

interface TaskModalProps {
  isOpen: boolean;
  task?: Task | null;
  users: User[];
  currentUser: User;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  conflictData?: {
    serverTask: Task;
    localTask: Task;
  } | null;
  onResolveConflict?: (resolution: 'merge' | 'overwrite', taskData: Partial<Task>) => void;
}

const priorityOptions = [
  { value: 'low', label: 'Low Priority', icon: '🟢', color: '#28a745' },
  { value: 'medium', label: 'Medium Priority', icon: '🟡', color: '#ffc107' },
  { value: 'high', label: 'High Priority', icon: '🔴', color: '#dc3545' }
];

const statusOptions = [
  { value: 'todo', label: 'To Do', icon: '📋' },
  { value: 'in-progress', label: 'In Progress', icon: '⚡' },
  { value: 'done', label: 'Done', icon: '✅' }
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  task,
  users,
  currentUser,
  onClose,
  onSave,
  onDelete,
  conflictData,
  onResolveConflict
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'in-progress' | 'done',
    assignedTo: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        assignedTo: task.assignedTo || '',
        priority: task.priority
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        assignedTo: '',
        priority: 'medium'
      });
    }
    setErrors({});
  }, [task]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSave({
        ...formData,
        assignedTo: formData.assignedTo || undefined
      });
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (task && onDelete && window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task._id);
      onClose();
    }
  };

  const handleConflictResolve = (resolution: 'merge' | 'overwrite') => {
    if (conflictData && onResolveConflict) {
      onResolveConflict(resolution, formData);
      onClose();
    }
  };

  const isEditMode = !!task;
  const canEdit = !task?.isLocked || task?.lockedBy?._id === currentUser._id;

  if (!isOpen) return null;

  // Conflict Resolution UI
  if (conflictData) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content conflict-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header conflict-header">
            <h2>🔄 Conflict Detected</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="conflict-content">
            <p className="conflict-message">
              This task has been modified by another user. Choose how to resolve the conflict:
            </p>
            
            <div className="conflict-comparison">
              <div className="conflict-version">
                <h4>📝 Your Changes</h4>
                <div className="version-details">
                  <p><strong>Title:</strong> {conflictData.localTask.title}</p>
                  <p><strong>Status:</strong> {conflictData.localTask.status}</p>
                  <p><strong>Priority:</strong> {conflictData.localTask.priority}</p>
                  <p><strong>Description:</strong> {conflictData.localTask.description || 'None'}</p>
                </div>
              </div>
              
              <div className="conflict-version">
                <h4>🌐 Server Version</h4>
                <div className="version-details">
                  <p><strong>Title:</strong> {conflictData.serverTask.title}</p>
                  <p><strong>Status:</strong> {conflictData.serverTask.status}</p>
                  <p><strong>Priority:</strong> {conflictData.serverTask.priority}</p>
                  <p><strong>Description:</strong> {conflictData.serverTask.description || 'None'}</p>
                  <p><strong>Modified by:</strong> {conflictData.serverTask.createdBy.username}</p>
                </div>
              </div>
            </div>
            
            <div className="conflict-actions">
              <button 
                className="btn btn-merge"
                onClick={() => handleConflictResolve('merge')}
              >
                🔀 Keep Your Changes
              </button>
              <button 
                className="btn btn-overwrite"
                onClick={() => handleConflictResolve('overwrite')}
              >
                📥 Use Server Version
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? '✏️ Edit Task' : '➕ Create New Task'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {task?.isLocked && (
          <div className="lock-warning">
            <span className="lock-icon">🔒</span>
            <span>
              {task.lockedBy?._id === currentUser._id 
                ? 'You are currently editing this task' 
                : `${task.lockedBy?.username} is currently editing this task`}
            </span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={errors.title ? 'error' : ''}
              placeholder="Enter task title..."
              disabled={!canEdit}
              maxLength={100}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                disabled={!canEdit}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                disabled={!canEdit}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="assignedTo">Assign To</label>
            <select
              id="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              disabled={!canEdit}
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  👤 {user.username}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={errors.description ? 'error' : ''}
              placeholder="Enter task description..."
              rows={4}
              disabled={!canEdit}
              maxLength={500}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
            <span className="char-count">{formData.description.length}/500</span>
          </div>
          
          {isEditMode && task && (
            <div className="task-meta">
              <div className="meta-item">
                <span className="meta-label">Created by:</span>
                <span className="meta-value">👤 {task.createdBy.username}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Created:</span>
                <span className="meta-value">📅 {new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Version:</span>
                <span className="meta-value">v{task.version}</span>
              </div>
            </div>
          )}
          
          <div className="modal-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            {isEditMode && onDelete && canEdit && (
              <button type="button" className="btn btn-delete" onClick={handleDelete}>
                🗑️ Delete
              </button>
            )}
            {canEdit && (
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? '⏳ Saving...' : (isEditMode ? '💾 Update' : '➕ Create')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
