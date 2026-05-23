import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { Truck, Plus, User, Edit2, MoreVertical, Smartphone, Search, Mail, Package, Trash2 } from 'lucide-react';
import { getDrivers, createDriver, updateDriver, getOrders, deleteDriver } from '../../services';
import DriverModal from '../../components/modals/DriverModal';

const DriversPage = () => {
    const [drivers, setDrivers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);

    const fetchData = async () => {
        try {
            const [driversRes, ordersRes] = await Promise.all([
                getDrivers(),
                getOrders()
            ]);
            setDrivers(driversRes.data);
            setOrders(ordersRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveDriver = async (formData) => {
        try {
            if (editingDriver) {
                await updateDriver(editingDriver._id, formData);
            } else {
                await createDriver(formData);
            }
            setIsModalOpen(false);
            setEditingDriver(null);
            fetchData();
        } catch (error) {
            alert('Failed to save driver');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this driver?')) {
            try {
                await deleteDriver(id);
                fetchData();
            } catch (error) {
                alert('Failed to delete driver');
            }
        }
    };

    const openEditModal = (driver) => {
        setEditingDriver(driver);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingDriver(null);
        setIsModalOpen(true);
    };

    const getDriverDeliveryStatus = (driverId) => {
        const driverOrders = orders.filter(o => o.assignedDriver?._id === driverId || o.assignedDriver === driverId);
        
        if (driverOrders.length === 0) {
            return { label: 'AVAILABLE', bg: 'var(--badge-green-bg)', color: '#10B981', count: 0 };
        }
        
        const activeOrders = driverOrders.filter(o => !['delivered', 'Completed', 'Cancelled', 'cancelled'].includes(o.status));
        
        if (activeOrders.length === 0) {
            return { label: 'AVAILABLE', bg: 'var(--badge-green-bg)', color: '#10B981', count: 0 };
        }
        
        const hasInProgress = activeOrders.some(o => o.status === 'Delivering');
        if (hasInProgress) {
            return { label: 'ON DELIVERY', bg: 'var(--badge-blue-bg)', color: '#3b82f6', count: activeOrders.length };
        }
        
        const hasPending = activeOrders.some(o => ['Pending', 'dispatched', 'Dispatched'].includes(o.status));
        if (hasPending) {
            return { label: 'PENDING DELIVERY', bg: 'var(--badge-yellow-bg)', color: '#f59e0b', count: activeOrders.length };
        }
        
        return { label: 'AVAILABLE', bg: 'var(--badge-green-bg)', color: '#10B981', count: 0 };
    };

    const filteredDrivers = drivers.filter(d => 
        (d.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.plateNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.licenseNo || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role="admin" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
                <Header breadcrumbs={['Drivers']} />
                <main className="content" style={{ padding: '2rem 3rem' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>Drivers</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '1.25rem' }}>Manage your delivery personnel and vehicles.</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ position: 'relative', width: '320px' }}>
                                <Search style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-light)' }} size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name, plate, or license..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.9rem', background: 'var(--surface-bg)' }}
                                />
                            </div>
                            <span style={{ padding: '0.5rem 1rem', background: 'var(--surface-bg)', border: '1px solid var(--border-light)', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                                {filteredDrivers.length} Total Drivers
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={openAddModal}
                        className="btn-primary" 
                        style={{ background: '#4F46E5', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontWeight: '600', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                        <Plus size={20} />
                        <span>Add Driver</span>
                    </button>
                </header>

                <div className="glass" style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--surface-hover)' }}>
                            <tr>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Driver Profile</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vehicle Details</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>License No.</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '4rem', textAlign: 'center' }}>
                                        <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #EEF2FF', borderTopColor: '#4F46E5', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                                        <p style={{ color: 'var(--text-muted)' }}>Loading drivers...</p>
                                    </td>
                                </tr>
                            ) : filteredDrivers.length > 0 ? filteredDrivers.map((driver) => {
                                const status = getDriverDeliveryStatus(driver._id);
                                
                                return (
                                    <tr key={driver._id} style={{ borderBottom: '1px solid var(--surface-hover)', transition: 'background 0.2s' }} className="table-row-hover">
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '40px', height: '40px', background: 'var(--badge-blue-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>{driver.user?.name || 'Unknown'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>ID: {driver._id.slice(-6).toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                {driver.user?.email ? (
                                                    <a href={`mailto:${driver.user?.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4F46E5', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '500' }}>
                                                        <Mail size={14} /> {driver.user?.email}
                                                    </a>
                                                ) : (
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>No email</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>{driver.vehicleType || 'N/A'}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--surface-hover)', padding: '0.1rem 0.5rem', borderRadius: '0.25rem', width: 'fit-content' }}>Plate: {driver.plateNo || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{driver.licenseNo || 'Not provided'}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                                                <span style={{ 
                                                    padding: '0.375rem 0.75rem', 
                                                    borderRadius: '1rem', 
                                                    fontSize: '0.7rem', 
                                                    fontWeight: '700',
                                                    background: status.bg,
                                                    color: status.color,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {status.label}
                                                </span>
                                                {status.count > 0 && (
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                                        <Package size={12} /> {status.count} Active Orders
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={() => openEditModal(driver)}
                                                    style={{ color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Manage Driver"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(driver._id)}
                                                    style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Delete Driver"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                        <Truck size={48} color="var(--border-medium)" style={{ margin: '0 auto 1rem' }} />
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>No drivers found</h3>
                                        <p style={{ fontSize: '0.9rem' }}>{searchQuery ? 'Try adjusting your search terms.' : 'Add your first driver to get started.'}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>

            <DriverModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveDriver}
                driver={editingDriver}
            />
        </div>
    );
};

export default DriversPage;
