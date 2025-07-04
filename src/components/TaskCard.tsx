import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, User } from '../types';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  users: User[];
  currentUser: User;
  onClick: () => void;
  onDelete: () => void;
  onSmartAssign: () => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#dc3545';
    case 'medium': return '#ffc107';
    case 'low': return '#28a745';
    default: return '#6c757d';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  users,
  currentUser,
  onClick,
  onDelete,
  onSmartAssign
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const transformStyle = transform ? {
    transform: CSS.Transform.toString(transform),
    transition,
  } : {};

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete();
    }
  };

  const handleSmartAssign = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSmartAssign();
  };

  const canEdit = !task.isLocked || task.lockedBy?._id === currentUser._id;

  return (
    <div
      ref={setNodeRef}
      style={transformStyle}
      {...attributes}
      {...listeners}
      className={`task-card ${isDragging ? 'dragging' : ''} ${!canEdit ? 'locked' : ''}`}
      onClick={onClick}
    >
      {task.isLocked && (
        <div className="lock-indicator">
          <span className="lock-icon">🔒</span>
          <span className="locked-by">
            {task.lockedBy?.username === currentUser.username 
              ? 'You are editing' 
              : `${task.lockedBy?.username} is editing`}
          </span>
        </div>
      )}
      
      <div className="task-header">
        <div className="task-priority">
          <span 
            className={`priority-indicator priority-${task.priority}`}
            title={`${task.priority} priority`}
          >
            {getPriorityIcon(task.priority)}
          </span>
        </div>
        
        <div className="task-actions">
          <button
            className="smart-assign-btn"
            onClick={handleSmartAssign}
            title="Smart assign to best available user"
          >
            🎯
          </button>
          <button
            className="delete-btn"
            onClick={handleDelete}
            title="Delete task"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="task-content">
        <h4 className="task-title">{task.title}</h4>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
      </div>
      
      <div className="task-footer">
        <div className="task-assignment">
          {task.assignedUser ? (
            <div className="assigned-user" title={`Assigned to ${task.assignedUser.username}`}>
              <div className="user-avatar small">
                {task.assignedUser.username.charAt(0).toUpperCase()}
              </div>
              <span className="assigned-name">{task.assignedUser.username}</span>
            </div>
          ) : (
            <div className="unassigned" title="Unassigned">
              <div className="user-avatar small unassigned">?</div>
              <span className="unassigned-text">Unassigned</span>
            </div>
          )}
        </div>
        
        <div className="task-meta">
          <span className="created-by" title={`Created by ${task.createdBy.username}`}>
            👤 {task.createdBy.username}
          </span>
          <span className="task-version" title={`Version ${task.version}`}>
            v{task.version}
          </span>
        </div>
      </div>
    </div>
  );
};
