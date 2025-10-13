import React, { useEffect, useState, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationPanel.css';

const NotificationPanel = () => {
    const {
        notifications,
        loading,
        showNotifications,
        setShowNotifications,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const [isScrollable, setIsScrollable] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const contentRef = useRef(null);

    console.log('NotificationPanel rendered, showNotifications:', showNotifications);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showNotifications && !event.target.closest('.notification-panel')) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications, setShowNotifications]);

    // Handle scroll events
    useEffect(() => {
        const handleScroll = () => {
            if (contentRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
                const isScrollableContent = scrollHeight > clientHeight;
                const shouldShowScrollToTop = scrollTop > 100;

                setIsScrollable(isScrollableContent);
                setShowScrollToTop(shouldShowScrollToTop);
            }
        };

        const contentElement = contentRef.current;
        if (contentElement) {
            contentElement.addEventListener('scroll', handleScroll);
            // Check initial state
            handleScroll();
        }

        return () => {
            if (contentElement) {
                contentElement.removeEventListener('scroll', handleScroll);
            }
        };
    }, [notifications, loading]);

    const scrollToTop = () => {
        if (contentRef.current) {
            contentRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    const scrollToBottom = () => {
        if (contentRef.current) {
            contentRef.current.scrollTo({
                top: contentRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    // Auto-scroll vers le bas quand le panneau s'ouvre
    useEffect(() => {
        if (showNotifications && contentRef.current && notifications.length > 0) {
            // Petit délai pour laisser le temps au DOM de se rendre
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        }
    }, [showNotifications, notifications.length]);

    const handleMarkAllAsRead = async () => {
        setIsMarkingAll(true);
        try {
            await markAllAsRead();
        } finally {
            setIsMarkingAll(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'À l\'instant';
        if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
        if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
        return date.toLocaleDateString('fr-FR');
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return '#ef4444';
            case 'high': return '#f59e0b';
            case 'medium': return '#3b82f6';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'order_status_change': return '📦';
            case 'new_order': return '🛒';
            case 'payment_received': return '💳';
            case 'order_cancelled': return '❌';
            case 'order_delivered': return '✅';
            default: return '🔔';
        }
    };

    if (!showNotifications) return null;

    return (
        <div className="notification-panel">
            <div className="notification-header">
                <h3>Notifications</h3>
                <div className="notification-actions">
                    {notifications.some(n => !n.isRead) && (
                        <button
                            className="mark-all-read-btn"
                            onClick={handleMarkAllAsRead}
                            disabled={isMarkingAll}
                            title="Marquer tout comme lu"
                        >
                            {isMarkingAll ? '⏳' : '✓'} Tout marquer comme lu
                        </button>
                    )}
                    <button
                        className="close-btn"
                        onClick={() => setShowNotifications(false)}
                        title="Fermer"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div
                ref={contentRef}
                className={`notification-content ${isScrollable ? 'scrollable' : ''}`}
            >
                {loading ? (
                    <div className="notification-loading">
                        <div className="loading-spinner"></div>
                        <p>Chargement des notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notification-empty">
                        <div className="empty-icon">🔔</div>
                        <p>Aucune notification</p>
                        <span>Toutes vos notifications apparaîtront ici</span>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                onClick={() => !notification.isRead && markAsRead(notification._id)}
                            >
                                <div className="notification-item-header">
                                    <div className="notification-icon">
                                        {getTypeIcon(notification.type)}
                                    </div>
                                    <div className="notification-meta">
                                        <h4 className="notification-title">{notification.title}</h4>
                                        <span className="notification-time">
                                            {formatTime(notification.createdAt)}
                                        </span>
                                    </div>
                                    <div className="notification-actions-item">
                                        <div
                                            className="priority-indicator"
                                            style={{ backgroundColor: getPriorityColor(notification.priority) }}
                                        ></div>
                                        <button
                                            className={`mark-read-btn ${notification.isRead ? 'read' : 'unread'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (notification.isRead) {
                                                    // Mark as unread
                                                    markAsUnread(notification._id);
                                                } else {
                                                    // Mark as read
                                                    markAsRead(notification._id);
                                                }
                                            }}
                                            title={notification.isRead ? "Marquer comme non lu" : "Marquer comme lu"}
                                        >
                                            {notification.isRead ? "👁️" : "✓"}
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification._id);
                                            }}
                                            title="Supprimer"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <p className="notification-message">{notification.message}</p>
                                {notification.orderId && (
                                    <div className="notification-order-info">
                                        <span className="order-number">
                                            Commande #{notification.orderId.orderNumber}
                                        </span>
                                        <span className="order-status">
                                            {notification.orderId.status === 'delivered' ? 'CONFIRMÉE' :
                                                notification.orderId.status === 'confirmed' ? 'CONFIRMÉE' :
                                                    notification.orderId.status === 'paid' ? 'PAYÉE' :
                                                        notification.orderId.status === 'pending' ? 'EN ATTENTE' :
                                                            notification.orderId.status === 'cancelled' ? 'ANNULÉE' :
                                                                notification.orderId.status?.toUpperCase() || 'EN ATTENTE'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Scroll buttons */}
                        <div className="scroll-buttons">
                            <button
                                className={`scroll-to-top ${showScrollToTop ? 'visible' : ''}`}
                                onClick={scrollToTop}
                                title="Remonter en haut"
                            >
                                ↑ Haut
                            </button>
                            <button
                                className="scroll-to-bottom"
                                onClick={scrollToBottom}
                                title="Aller en bas"
                            >
                                ↓ Bas
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
