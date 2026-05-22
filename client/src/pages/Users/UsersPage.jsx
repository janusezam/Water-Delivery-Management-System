import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import UserModal from '../../components/modals/UserModal';
import { Users, UserPlus, Mail, Shield, Trash2, Edit2, Search, Plus } from 'lucide-react';
import { getUsers, updateUser, deleteUser, register } from '../../services';
import Toast from '../../components/common/Toast';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await getUsers();
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const handleSaveUser = async (userData) => {
        try {
            if (selectedUser) {
                await updateUser(selectedUser._id, userData);
            } else {
                await register(userData);
            }
            showToast(selectedUser ? 'User updated successfully' : 'User registered successfully');
            setIsModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save user', 'error');
        }
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateUser(userId, { role: newRole });
            showToast('Role updated successfully');
            fetchUsers();
        } catch (error) {
            showToast('Failed to update user role', 'error');
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to remove this user?')) {
            try {
                await deleteUser(userId);
                showToast('User removed successfully');
                fetchUsers();
            } catch (error) {
                showToast('Failed to delete user', 'error');
            }
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-container" style={{ background: 'var(--page-bg)' }}>
            <Sidebar role="admin" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['Users']} />
                
                {loading ? (
                    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', minHeight: '100vh' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #EEF2FF', borderTopColor: '#4F46E5', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                            <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>Loading Users...</p>
                        </div>
                    </div>
                ) : (
                    <main className="content" style={{ padding: '2rem 3rem', animation: 'fadeIn 0.5s ease-out' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>Users</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>Manage system roles and access levels.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} size={18} />
                                    <input 
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ 
                                            padding: '0.75rem 1rem 0.75rem 3rem',
                                            borderRadius: '0.75rem',
                                            border: '1px solid var(--border-light)',
                                            width: '250px',
                                            outline: 'none',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                </div>
                                <button 
                                    onClick={handleAddClick}
                                    style={{ 
                                        background: '#4F46E5', 
                                        color: 'white', 
                                        padding: '0.75rem 1.25rem', 
                                        borderRadius: '0.75rem', 
                                        border: 'none', 
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                                    }}
                                >
                                    <Plus size={20} />
                                    Add User
                                </button>
                            </div>
                        </header>

                        <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--surface-hover)' }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User</th>
                                        <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role</th>
                                        <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined Date</th>
                                        <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user._id} style={{ borderBottom: '1px solid var(--surface-hover)' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '36px', height: '36px', background: 'var(--surface-hover)', color: '#4F46E5', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: '700' }}>
                                                        {user.name[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ 
                                                    padding: '0.4rem 0.75rem',
                                                    borderRadius: '2rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    background: user.role === 'admin' ? 'var(--badge-red-bg)' : user.role === 'staff' ? 'var(--badge-blue-bg)' : 'var(--badge-green-bg)',
                                                    color: user.role === 'admin' ? '#EF4444' : user.role === 'staff' ? '#4F46E5' : '#10B981',
                                                }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                {user.email !== 'admin@wrs.com' ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button 
                                                            onClick={() => handleEditClick(user)}
                                                            style={{ color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                                                            title="Edit User"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(user._id)}
                                                            style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontStyle: 'italic' }}>Protected</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </main>
                )}
            </div>

            <UserModal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedUser(null);
                }} 
                user={selectedUser}
                onSave={handleSaveUser} 
            />

            <Toast 
                {...toast} 
                onClose={() => setToast({ ...toast, show: false })} 
            />
        </div>
    );
};

export default UsersPage;
