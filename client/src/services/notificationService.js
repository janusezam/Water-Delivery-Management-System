import { axiosClient } from './axios';

// Get paginated notifications for current user
export const getNotifications = (page = 1, limit = 20) => {
    return axiosClient.get(`/api/notifications?page=${page}&limit=${limit}`);
};

// Get unread notification count
export const getUnreadCount = () => {
    return axiosClient.get('/api/notifications/unread-count');
};

// Mark a single notification as read
export const markNotificationAsRead = (id) => {
    return axiosClient.put(`/api/notifications/${id}/read`);
};

// Mark all notifications as read
export const markAllNotificationsAsRead = () => {
    return axiosClient.put('/api/notifications/read-all');
};

// Delete a notification
export const deleteNotification = (id) => {
    return axiosClient.delete(`/api/notifications/${id}`);
};
