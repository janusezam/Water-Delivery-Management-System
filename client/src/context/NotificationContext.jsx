import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

// Notification sound using Web Audio API (no external file needed)
const playNotificationSound = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Create a pleasant two-tone chime
        const playTone = (frequency, startTime, duration) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime + startTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);

            oscillator.start(audioCtx.currentTime + startTime);
            oscillator.stop(audioCtx.currentTime + startTime + duration);
        };

        playTone(880, 0, 0.15);     // A5
        playTone(1175, 0.1, 0.2);   // D6
    } catch (e) {
        // Audio not supported, silent fail
    }
};

// Notification type to icon mapping for toast
const getNotificationIcon = (type) => {
    const icons = {
        order_created: '🛒',
        order_status: '📋',
        order_assigned: '🚚',
        order_cancelled: '❌',
        delivery_completed: '✅',
        delivery_failed: '⚠️',
        trip_created: '🗺️',
        trip_assigned: '📍',
        trip_ended: '🏁',
        trip_completed: '✅',
        trip_cancelled: '❌',
        low_stock: '📦',
        expense_logged: '⛽'
    };
    return icons[type] || '🔔';
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [userId, setUserId] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user'))?._id || null;
        } catch {
            return null;
        }
    });
    const [page, setPage] = useState(1);
    const socketRef = useRef(null);

    // Fetch notifications from API
    const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
        try {
            setIsLoading(true);
            const { data } = await getNotifications(pageNum, 15);
            if (append) {
                setNotifications(prev => [...prev, ...data.data]);
            } else {
                setNotifications(data.data);
            }
            setHasMore(pageNum < data.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const { data } = await getUnreadCount();
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, []);

    // Load more notifications (pagination)
    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchNotifications(page + 1, true);
        }
    }, [isLoading, hasMore, page, fetchNotifications]);

    // Mark single notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n =>
                    n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }, []);

    // Refresh notifications
    const refresh = useCallback(() => {
        fetchNotifications(1, false);
        fetchUnreadCount();
    }, [fetchNotifications, fetchUnreadCount]);

    // Poll localStorage for authentication state updates (handles same-tab and multi-tab logins/logouts)
    useEffect(() => {
        const checkAuth = () => {
            try {
                const userVal = JSON.parse(localStorage.getItem('user'));
                const currentUserId = userVal?._id || null;
                const tokenVal = localStorage.getItem('token');
                
                // If either token or user is missing, treat as logged out
                const activeId = tokenVal ? currentUserId : null;
                
                if (activeId !== userId) {
                    setUserId(activeId);
                    if (!activeId) {
                        setNotifications([]);
                        setUnreadCount(0);
                    }
                }
            } catch (e) {
                if (userId !== null) {
                    setUserId(null);
                    setNotifications([]);
                    setUnreadCount(0);
                }
            }
        };

        const interval = setInterval(checkAuth, 1000);
        window.addEventListener('storage', checkAuth);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', checkAuth);
        };
    }, [userId]);

    // Initialize socket connection and listeners when userId is available
    useEffect(() => {
        if (!userId) return;

        // Fetch initial data
        fetchNotifications(1, false);
        fetchUnreadCount();

        // Connect to Socket.IO
        const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            // Join personal notification room
            socket.emit('user:join', userId);
        });

        // Listen for new notifications
        socket.on('notification:new', ({ notification, unreadCount: newCount }) => {
            // Add to top of list
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(newCount);

            // Play sound
            playNotificationSound();

            // Show toast
            const icon = getNotificationIcon(notification.type);
            toast(
                (t) => (
                    <div
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}
                        onClick={() => toast.dismiss(t.id)}
                    >
                        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.15rem' }}>
                                {notification.title}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.4 }}>
                                {notification.message}
                            </div>
                        </div>
                    </div>
                ),
                {
                    duration: 5000,
                    style: {
                        background: 'var(--modal-bg, #fff)',
                        color: 'var(--text-main, #1f2937)',
                        border: '1px solid var(--border-light, #e5e7eb)',
                        borderRadius: '0.75rem',
                        padding: '0.875rem 1rem',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                        maxWidth: '380px'
                    }
                }
            );
        });

        socket.on('disconnect', () => {
            console.log('Notification socket disconnected');
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [userId, fetchNotifications, fetchUnreadCount]);

    const value = {
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        markAsRead,
        markAllAsRead,
        loadMore,
        refresh,
        fetchUnreadCount
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
