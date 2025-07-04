import React, { useEffect, useRef } from 'react';
import { Activity } from '../types';
import './ActivityFeed.css';

interface ActivityFeedProps {
  activities: Activity[];
  isVisible: boolean;
  onClose: () => void;
}

const getActivityIcon = (action: string) => {
  switch (action) {
    case 'created': return '➕';
    case 'updated': return '✏️';
    case 'deleted': return '🗑️';
    case 'assigned': return '👤';
    case 'unassigned': return '👥';
    case 'status_changed': return '📋';
    case 'priority_changed': return '🎯';
    default: return '📝';
  }
};

const getActivityColor = (action: string) => {
  switch (action) {
    case 'created': return '#28a745';
    case 'updated': return '#007bff';
    case 'deleted': return '#dc3545';
    case 'assigned': return '#17a2b8';
    case 'unassigned': return '#6c757d';
    case 'status_changed': return '#ffc107';
    case 'priority_changed': return '#fd7e14';
    default: return '#6c757d';
  }
};

const formatActivityMessage = (activity: Activity) => {
  const { action, username, taskTitle, details } = activity;
  
  switch (action) {
    case 'created':
      return `${username} created task "${taskTitle}"`;
    case 'updated':
      return `${username} updated task "${taskTitle}"`;
    case 'deleted':
      return `${username} deleted task "${taskTitle}"`;
    case 'assigned':
      return `${username} assigned task "${taskTitle}" to ${details?.assignedTo || 'someone'}`;
    case 'unassigned':
      return `${username} unassigned task "${taskTitle}"`;
    case 'status_changed':
      return `${username} moved "${taskTitle}" to ${details?.newStatus || 'new status'}`;
    case 'priority_changed':
      return `${username} changed priority of "${taskTitle}" to ${details?.newPriority || 'new priority'}`;
    default:
      return `${username} performed an action on "${taskTitle}"`;
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  isVisible,
  onClose
}) => {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [activities, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="activity-feed-overlay" onClick={onClose}>
      <div className="activity-feed" onClick={(e) => e.stopPropagation()}>
        <div className="activity-header">
          <div className="activity-title">
            <span className="activity-icon">🔔</span>
            <h3>Recent Activity</h3>
            <span className="activity-count">{activities.length}</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="activity-content" ref={feedRef}>
          {activities.length === 0 ? (
            <div className="empty-activity">
              <span className="empty-icon">📭</span>
              <p>No recent activity</p>
              <p className="empty-hint">Activity will appear here as team members work on tasks</p>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((activity, index) => (
                <div key={activity._id} className="activity-item">
                  <div className="activity-timeline">
                    <div 
                      className={`timeline-dot ${activity.action}`}
                    >
                      <span className="timeline-icon">
                        {getActivityIcon(activity.action)}
                      </span>
                    </div>
                    {index < activities.length - 1 && <div className="timeline-line" />}
                  </div>
                  
                  <div className="activity-details">
                    <div className="activity-message">
                      {formatActivityMessage(activity)}
                    </div>
                    
                    <div className="activity-meta">
                      <span className="activity-time">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                      {activity.details && (
                        <span className="activity-extra">
                          {activity.action === 'status_changed' && 
                            `${activity.details.oldStatus} → ${activity.details.newStatus}`}
                          {activity.action === 'priority_changed' && 
                            `${activity.details.oldPriority} → ${activity.details.newPriority}`}
                          {activity.action === 'assigned' && activity.details.assignedTo && 
                            `to ${activity.details.assignedTo}`}
                        </span>
                      )}
                    </div>
                    
                    {activity.details?.changes && (
                      <div className="activity-changes">
                        <details>
                          <summary>View changes</summary>
                          <div className="change-details">
                            {Object.entries(activity.details.changes).map(([field, change]: [string, any]) => (
                              <div key={field} className="change-item">
                                <span className="change-field">{field}:</span>
                                <span className="change-old">{change.old || 'None'}</span>
                                <span className="change-arrow">→</span>
                                <span className="change-new">{change.new || 'None'}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="activity-footer">
          <div className="activity-stats">
            <span className="stat-item">
              📈 {activities.filter(a => a.action === 'created').length} created
            </span>
            <span className="stat-item">
              ✏️ {activities.filter(a => a.action === 'updated').length} updated
            </span>
            <span className="stat-item">
              ✅ {activities.filter(a => a.action === 'status_changed').length} moved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
