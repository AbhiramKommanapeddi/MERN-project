import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { Task, User } from '../types';
import './TaskColumn.css';

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  users: User[];
  currentUser: User;
  onTaskClick: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onSmartAssign: (taskId: string) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'todo': return '📋';
    case 'in-progress': return '⚡';
    case 'done': return '✅';
    default: return '📋';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo': return '#6c757d';
    case 'in-progress': return '#ffc107';
    case 'done': return '#28a745';
    default: return '#6c757d';
  }
};

export const TaskColumn: React.FC<TaskColumnProps> = ({
  id,
  title,
  tasks,
  users,
  currentUser,
  onTaskClick,
  onDeleteTask,
  onSmartAssign
}) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);

  return (
    <div className="task-column">
      <div className="column-header">
        <div className="column-title">
          <span className="column-icon">{getStatusIcon(id)}</span>
          <h3 className={`${id}-status`}>{title}</h3>
          <span className="task-count">{tasks.length}</span>
        </div>
      </div>
      
      <div 
        ref={setNodeRef}
        className="task-list"
      >
        <SortableContext 
          items={sortedTasks.map(task => task._id)} 
          strategy={verticalListSortingStrategy}
        >
          {sortedTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              users={users}
              currentUser={currentUser}
              onClick={() => onTaskClick(task)}
              onDelete={() => onDeleteTask(task._id)}
              onSmartAssign={() => onSmartAssign(task._id)}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="empty-column">
            <span className="empty-icon">🎯</span>
            <p>No tasks here yet</p>
            <p className="empty-hint">Drag tasks here or create new ones</p>
          </div>
        )}
      </div>
    </div>
  );
};
