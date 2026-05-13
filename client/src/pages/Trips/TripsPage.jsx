import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { Truck, MapPin, Calendar, ChevronRight, User, Plus, Clock } from 'lucide-react';
import { getTrips } from '../../services';

const TripsPage = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const { data } = await getTrips();
                setTrips(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching trips', error);
                setLoading(false);
            }
        };
        fetchTrips();
    }, []);

    return (
        <div className="dashboard-container" style={{ background: 'var(--page-bg)' }}>
            <Sidebar role="admin" />

            <main className="content" style={{ padding: '2rem 3rem' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>Dispatch Board</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>Organize orders into trips and assign them to drivers.</p>
                    </div>
                    <button className="btn-primary" style={{ background: '#4F46E5', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontWeight: '600', color: 'white', border: 'none', cursor: 'pointer' }}>
                        <Plus size={20} />
                        <span>Create New Trip</span>
                    </button>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {trips.length > 0 ? trips.map((trip) => (
                        <div key={trip._id} style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--surface-hover)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ padding: '0.5rem', background: 'var(--badge-blue-bg)', borderRadius: '0.75rem', color: '#4F46E5' }}>
                                            <Truck size={20} />
                                        </div>
                                        <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>TRIP-{trip._id.slice(-4).toUpperCase()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <User size={16} />
                                        <span>{trip.driver?.user?.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <Clock size={16} />
                                        <span>{new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                                <span style={{ 
                                    padding: '0.375rem 0.75rem', 
                                    borderRadius: '1rem', 
                                    fontSize: '0.75rem', 
                                    fontWeight: '700',
                                    background: trip.status === 'ongoing' ? '#EEF2FF' : '#ECFDF5',
                                    color: trip.status === 'ongoing' ? '#4F46E5' : '#10B981',
                                    textTransform: 'uppercase'
                                }}>
                                    {trip.status}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {trip.orders?.map((order, i) => (
                                    <div key={order._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--page-bg)', borderRadius: '0.75rem', border: '1px solid var(--border-light)' }}>
                                        <div style={{ width: '24px', height: '24px', background: '#4F46E5', color: 'white', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: '800' }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customer?.name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{order.deliveryAddress?.split(',')[0]}</p>
                                        </div>
                                        {order.status === 'delivered' ? <CheckCircle size={16} color="#10B981" /> : <ChevronRight size={16} color="var(--text-light)" />}
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <MapPin size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                    {trip.orders?.length} stops assigned
                                </p>
                                <button style={{ padding: '0.5rem 1rem', background: 'var(--badge-blue-bg)', color: '#4F46E5', border: 'none', borderRadius: '0.75rem', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    View Route Details
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-light)' }}>
                            {loading ? 'Loading trips...' : 'No active trips. Dispatch a driver to get started!'}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TripsPage;
