const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification and push it via Socket.IO in real-time.
 * 
 * @param {Object} params
 * @param {string} params.recipientId - User ID of the recipient
 * @param {string} params.type - Notification type enum
 * @param {string} params.title - Short title
 * @param {string} params.message - Descriptive message
 * @param {string} [params.relatedModel] - 'Order', 'TripSale', 'Product', 'GasExpense'
 * @param {string} [params.relatedId] - MongoDB ObjectId of the related document
 * @param {Object} [params.io] - Socket.IO server instance (if not passed, uses global)
 */
const createNotification = async ({
    recipientId,
    type,
    title,
    message,
    relatedModel = null,
    relatedId = null,
    io = null
}) => {
    try {
        // Don't create notification if no recipient
        if (!recipientId) return null;

        const notification = await Notification.create({
            recipient: recipientId,
            type,
            title,
            message,
            relatedModel,
            relatedId
        });

        // Push via Socket.IO if available
        const socketIo = io || global._io;
        if (socketIo) {
            // Get updated unread count
            const unreadCount = await Notification.countDocuments({
                recipient: recipientId,
                isRead: false
            });

            // Emit to user's personal room
            socketIo.to(`user-${recipientId}`).emit('notification:new', {
                notification: notification.toObject(),
                unreadCount
            });
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null; // Don't let notification failures break the main flow
    }
};

/**
 * Send notifications to all users with a specific role.
 */
const notifyRole = async ({ role, type, title, message, relatedModel, relatedId, io, excludeUserId }) => {
    try {
        const query = { role, isActivated: true };
        if (excludeUserId) {
            query._id = { $ne: excludeUserId };
        }
        const users = await User.find(query).select('_id');

        const promises = users.map(user =>
            createNotification({
                recipientId: user._id,
                type,
                title,
                message,
                relatedModel,
                relatedId,
                io
            })
        );

        await Promise.all(promises);
    } catch (error) {
        console.error('Error notifying role:', error);
    }
};

/**
 * Send notifications to multiple specific roles.
 */
const notifyRoles = async ({ roles, type, title, message, relatedModel, relatedId, io, excludeUserId }) => {
    const promises = roles.map(role =>
        notifyRole({ role, type, title, message, relatedModel, relatedId, io, excludeUserId })
    );
    await Promise.all(promises);
};

module.exports = {
    createNotification,
    notifyRole,
    notifyRoles
};
