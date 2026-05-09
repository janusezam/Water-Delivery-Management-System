const DriverLocation = require('../models/DriverLocation');

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Driver joins their own room and the 'drivers' group
        socket.on('driver:join', (driverId) => {
            socket.join(`driver-${driverId}`);
            console.log(`Driver ${driverId} joined`);
        });

        // Admin/Staff joins the admin room to receive all updates
        socket.on('admin:join', () => {
            socket.join('admin-room');
            console.log('Admin joined live map');
        });

        // Handle GPS updates from driver
        socket.on('driver:location', async ({ driverId, lat, lng, heading }) => {
            try {
                // Update DB (upsert)
                await DriverLocation.findOneAndUpdate(
                    { driver: driverId },
                    { lat, lng, heading, updatedAt: new Date() },
                    { upsert: true }
                );

                // Broadcast to admin room
                io.to('admin-room').emit('location:update', { 
                    driverId, 
                    lat, 
                    lng, 
                    heading 
                });
                
                console.log(`Location update for ${driverId}: ${lat}, ${lng}`);
            } catch (error) {
                console.error('Socket location error:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

module.exports = socketHandler;
