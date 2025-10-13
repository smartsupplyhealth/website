const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const Client = require('../models/Client');

// Get all notifications
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user.id;

        // Get user's notifications with pagination
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('orderId', 'orderNumber status')
            .lean();

        const unreadCount = await Notification.countDocuments({
            user: userId,
            isRead: false
        });

        const totalCount = await Notification.countDocuments({ user: userId });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                totalCount,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get unread count only
router.get('/unread-count', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadCount = await Notification.countDocuments({
            user: userId,
            isRead: false
        });

        res.json({
            success: true,
            data: {
                unreadCount
            }
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Mark notification as read
router.patch('/:notificationId/read', auth, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, user: userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Mark notification as unread
router.patch('/:notificationId/unread', auth, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, user: userId },
            { isRead: false },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as unread'
        });
    } catch (error) {
        console.error('Error marking notification as unread:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Mark all notifications as read
router.patch('/mark-all-read', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            { user: userId, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Delete notification
router.delete('/:notificationId', auth, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            user: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;

