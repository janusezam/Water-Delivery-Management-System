import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix Leaflet icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

const DriverRoutePage = () => {
    const [orders, setOrders] = useState([]);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const fetchMyOrders = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/orders'); 
                setOrders(data.filter(o => o.status !== 'delivered'));
            } catch (error) {
                console.error('Error fetching orders', error);
            }
        };
        fetchMyOrders();
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
            <Sidebar role="driver" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['Active Route']} />

                <main style={{ flex: 1, padding: '1rem', position: 'relative' }}>
                    <div style={{ 
                        height: '100%', 
                        width: '100%', 
                        borderRadius: '1.25rem', 
                        overflow: 'hidden', 
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}>
                        <MapContainer center={[14.5995, 120.9842]} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {orders.map((order, i) => (
                                <Marker key={order._id} position={[14.5995 + (i * 0.005), 120.9842 + (i * 0.005)]} icon={DefaultIcon}>
                                    <Popup>
                                        <div style={{ fontWeight: '700' }}>{order.customer?.name}</div>
                                        <div style={{ fontSize: '0.8rem' }}>{order.deliveryAddress}</div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>

                    {/* Floating Info Card */}
                    <div style={{ 
                        position: 'absolute', 
                        bottom: '2.5rem', 
                        left: '2.5rem', 
                        right: '2.5rem', 
                        background: 'white', 
                        padding: '1.25rem', 
                        borderRadius: '1rem', 
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        zIndex: 1000,
                        border: '1px solid #E5E7EB',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Next Stop</div>
                            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#111827' }}>{orders[0]?.customer?.name || 'No more stops'}</div>
                        </div>
                        <button 
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(orders[0]?.deliveryAddress)}`)}
                            style={{ 
                                background: '#4F46E5', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', 
                                border: 'none', fontWeight: '700', cursor: 'pointer'
                            }}
                        >
                            Open in Google Maps
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DriverRoutePage;
