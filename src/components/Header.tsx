import React from 'react';
import { User } from '../types';
import './Header.css';

interface HeaderProps {
  user: User | null;
  onlineUsers: User[];
  onLogout: () => void;
  onToggleActivity: () => void;
  showActivity: boolean;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onlineUsers,
  onLogout,
  onToggleActivity,
  showActivity
}) => {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">
          <span className="title-icon">📋</span>
          CollabBoard
        </h1>
        <div className="online-users">
          <span className="online-count">
            {onlineUsers.length} online
          </span>
          <div className="online-avatars">
            {onlineUsers.slice(0, 5).map((onlineUser) => (
              <div 
                key={onlineUser._id} 
                className={`user-avatar ${onlineUser._id === user?._id ? 'current-user' : ''}`}
                title={onlineUser.username}
              >
                {onlineUser.username.charAt(0).toUpperCase()}
              </div>
            ))}
            {onlineUsers.length > 5 && (
              <div className="user-avatar overflow">
                +{onlineUsers.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="header-right">
        <button 
          className={`activity-toggle ${showActivity ? 'active' : ''}`}
          onClick={onToggleActivity}
          title="Toggle Activity Feed"
        >
          <span className="activity-icon">🔔</span>
          Activity
        </button>
        
        <div className="user-menu">
          <div className="current-user">
            <div className="user-avatar current-user">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <span className="username">{user?.username}</span>
          </div>
          <button 
            className="logout-btn"
            onClick={onLogout}
            title="Logout"
          >
            <span className="logout-icon">🚪</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
