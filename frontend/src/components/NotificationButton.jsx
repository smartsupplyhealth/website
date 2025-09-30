import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationButton.css';

const NotificationButton = () => {
    const { unreadCount, toggleNotifications, showNotifications } = useNotifications();

    console.log('NotificationButton rendered:', { unreadCount, showNotifications });

    return (
        <div className="notification-container">
            <button
                className={`notification-button ${showNotifications ? 'active' : ''}`}
                onClick={toggleNotifications}
                title="Notifications"
            >
                <svg
                    className="notification-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>

                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default NotificationButton;
