import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { Users, Plus, Search, Phone, MapPin, ChevronRight, Trash2 } from 'lucide-react';
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
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', padding: '1.5rem' }}>
                        {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                            <div key={customer._id} 
                                onClick={() => openEditModal(customer)}
                                className="customer-card storefront-product-card" 
                                style={{ padding: '1.5rem', cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', background: 'var(--surface-hover)', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '1.2rem', fontWeight: '700', color: '#4F46E5' }}>
                                        {customer.name[0]}
                                    </div>
                                    <span style={{ 
                                        padding: '0.25rem 0.625rem', 
                                        borderRadius: '1rem', 
                                        fontSize: '0.7rem', 
                                        fontWeight: '700',
                                        background: customer.jugBalance > 0 ? 'var(--badge-red-bg)' : 'var(--badge-green-bg)',
                                        color: customer.jugBalance > 0 ? '#EF4444' : '#10B981'
                                    }}>
                                        {customer.jugBalance > 0 ? `Owes ${customer.jugBalance} Jugs` : 'Clear Balance'}
                                    </span>
                                </div>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{customer.name}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <Phone size={14} />
                                        <span>{customer.phone}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <MapPin size={14} />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {customer.addresses?.[0]?.street}, {customer.addresses?.[0]?.barangay}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--surface-hover)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{customer.totalOrders} total orders</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(customer._id); }}
                                            style={{ background: 'var(--badge-red-bg)', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '0.5rem', transition: 'all 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
                                            onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <ChevronRight size={18} color="var(--text-light)" />
                                </div>
                            </div>
                        )) : (
                            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                {loading ? 'Loading customers...' : 'No customers found.'}
                            </div>
                        )}
                    </div>
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
