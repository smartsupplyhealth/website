import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config/environment';

export const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    console.warn('useNotifications must be used within a NotificationProvider. Returning default values.');
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      showNotifications: false,
      showNotification: (message, type) => console.log(`Notification: ${message} (${type})`),
      fetchNotifications: () => { },
      fetchUnreadCount: () => { },
      markAsRead: () => { },
      markAllAsRead: () => { },
      deleteNotification: () => { },
      toggleNotifications: () => { },
      setShowNotifications: () => { }
    };
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const token = localStorage.getItem('token');

  // Fetch notifications
  const fetchNotifications = async (page = 1, limit = 20) => {
    if (!token) {
      console.log('No token available for fetching notifications');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/notifications?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count only
  const fetchUnreadCount = async () => {
    if (!token) {
      console.log('No token available for fetching unread count');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.unreadCount);
      } else if (response.status === 401) {
        // Token expired, clear it
        localStorage.removeItem('token');
        console.log('Token expired, cleared from storage');
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      // Don't retry immediately on error
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!token) {
      console.log('No token available for marking notification as read');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!token) {
      console.log('No token available for marking all notifications as read');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!token) {
      console.log('No token available for deleting notification');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Toggle notifications panel
  const toggleNotifications = () => {
    console.log('Toggle notifications clicked, current state:', showNotifications);
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      console.log('Opening notifications, fetching data...');
      fetchNotifications();
    } else {
      console.log('Closing notifications');
    }
  };

  // Show notification function
  const showNotification = (message, type = 'info') => {
    // Create custom notification element
    const notification = document.createElement('div');
    notification.className = `custom-notification custom-notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add styles if not already added
    if (!document.getElementById('custom-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'custom-notification-styles';
      style.textContent = `
        .custom-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          z-index: 10000;
          min-width: 300px;
          max-width: 400px;
          animation: slideInRight 0.3s ease-out;
          border-left: 4px solid #10b981;
        }
        
        .custom-notification-success {
          border-left-color: #10b981;
        }
        
        .custom-notification-error {
          border-left-color: #ef4444;
        }
        
        .custom-notification-warning {
          border-left-color: #f59e0b;
        }
        
        .custom-notification-info {
          border-left-color: #3b82f6;
        }
        
        .notification-content {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          gap: 12px;
        }
        
        .notification-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        
        .notification-message {
          flex: 1;
          color: #1f2937;
          font-weight: 500;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .notification-close {
          background: none;
          border: none;
          font-size: 20px;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        
        .notification-close:hover {
          background: #f3f4f6;
          color: #374151;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          .custom-notification {
            top: 10px;
            right: 10px;
            left: 10px;
            min-width: auto;
            max-width: none;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, 4000);
  };

  // Auto-refresh unread count every 30 seconds - DISABLED to prevent infinite loop
  useEffect(() => {
    if (token) {
      // Only fetch once on mount, no auto-refresh for now
      const timeoutId = setTimeout(() => {
        fetchUnreadCount();
      }, 2000); // Delay to prevent immediate calls

      return () => clearTimeout(timeoutId);
    }
  }, [token]);

  const value = {
    notifications,
    unreadCount,
    loading,
    showNotifications,
    showNotification,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    toggleNotifications,
    setShowNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};