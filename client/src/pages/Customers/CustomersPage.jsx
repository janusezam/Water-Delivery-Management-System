import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { Users, Plus, Search, Phone, MapPin, Edit2, Trash2 } from 'lucide-react';
import { getCustomers, deleteCustomer, createCustomer, updateCustomer } from '../../services';
import CustomerModal from '../../components/modals/CustomerModal';

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    const fetchCustomers = async () => {
        try {
            const { data } = await getCustomers();
            setCustomers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching customers', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await deleteCustomer(id);
                fetchCustomers();
            } catch (error) {
                alert('Failed to delete customer');
            }
        }
    };

    const handleSaveCustomer = async (formData) => {
        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer._id, formData);
            } else {
                await createCustomer(formData);
            }
            setIsModalOpen(false);
            setEditingCustomer(null);
            fetchCustomers();
        } catch (error) {
            alert('Failed to save customer');
        }
    };

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const filteredCustomers = customers.filter(c => 
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role="admin" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
                <Header breadcrumbs={['Customers']} />
                <main className="content" style={{ padding: '2rem 3rem' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>Customers</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>Manage your customer base and jug balances.</p>
                    </div>
                    <button 
                        onClick={openAddModal}
                        className="btn-primary" 
                        style={{ background: '#4F46E5', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontWeight: '600', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                        <Plus size={20} />
                        <span>Add Customer</span>
                    </button>
                </header>

                <div className="glass" style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '320px' }}>
                            <Search style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-light)' }} size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by name or phone..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.9rem', background: 'var(--input-bg)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ padding: '0.5rem 1rem', background: 'var(--surface-hover)', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                                {filteredCustomers.length} Total Customers
                            </span>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--surface-hover)' }}>
                            <tr>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Info</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary Address</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Total Orders</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Jug Balance</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                                <tr key={customer._id} style={{ borderBottom: '1px solid var(--surface-hover)', transition: 'background 0.2s' }} className="table-row-hover">
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', background: 'var(--surface-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '700', color: '#4F46E5' }}>
                                                {customer.name[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{customer.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>ID: {customer._id.slice(-6).toUpperCase()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <Phone size={14} />
                                            {customer.phone}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', maxWidth: '250px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <MapPin size={14} style={{ flexShrink: 0 }} />
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {customer.addresses?.[0]?.street ? `${customer.addresses[0].street}, ${customer.addresses[0].barangay}` : 'No address provided'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{customer.totalOrders}</span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                        <span style={{ 
                                            padding: '0.375rem 0.75rem', 
                                            borderRadius: '1rem', 
                                            fontSize: '0.75rem', 
                                            fontWeight: '700',
                                            background: customer.jugBalance > 0 ? 'var(--badge-red-bg)' : (customer.jugBalance < 0 ? 'var(--badge-blue-bg)' : 'var(--badge-green-bg)'),
                                            color: customer.jugBalance > 0 ? '#EF4444' : (customer.jugBalance < 0 ? '#3B82F6' : '#10B981'),
                                            display: 'inline-block'
                                        }}>
                                            {customer.jugBalance > 0 ? `Owes ${customer.jugBalance}` : (customer.jugBalance < 0 ? `Owed ${Math.abs(customer.jugBalance)}` : 'Clear')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => openEditModal(customer)}
                                                style={{ color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Manage Customer"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(customer._id)}
                                                style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Delete Customer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                        {loading ? 'Loading customers...' : 'No customers found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>

            <CustomerModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCustomer}
                customer={editingCustomer}
            />
        </div>
    );
};

export default CustomersPage;
