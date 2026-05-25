const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
const getUsers = async (req, res) => {
    console.log('GET /api/users hit');
    try {
        const users = await User.find({}).select('-password');
        console.log('Users found:', users.length);
        res.json(users);
    } catch (error) {
        console.error('Error in getUsers:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// @desc    Update user role or status
// @route   PUT /api/users/:id
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.email === 'admin@wrs.com' && req.body.role && req.body.role !== 'admin') {
                return res.status(400).json({ message: 'Cannot downgrade the primary system admin account role' });
            }

            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;

            if (req.body.password) {
                user.password = req.body.password;
            }
            
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error updating user' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.email === 'admin@wrs.com') {
                return res.status(400).json({ message: 'Cannot delete the primary system admin account' });
            }
            await User.deleteOne({ _id: user._id });
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error removing user' });
    }
};

// @desc    Get authenticated user's profile
// @route   GET /api/users/profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -activationOTP -activationOTPExpires -resetPasswordOTP -resetPasswordExpires');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            _id: user._id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            name: user.name || '',
            email: user.email,
            mobileNumber: user.mobileNumber || '',
            role: user.role,
            profilePicture: user.profilePicture || null,
            isGoogleUser: !!user.googleId,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

// @desc    Update authenticated user's profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { firstName, lastName, mobileNumber, currentPassword, newPassword } = req.body;

        // Update basic info
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (mobileNumber !== undefined) user.mobileNumber = mobileNumber;

        // Password change
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required' });
            }
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            user.password = newPassword;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            firstName: updatedUser.firstName || '',
            lastName: updatedUser.lastName || '',
            name: updatedUser.name || '',
            email: updatedUser.email,
            mobileNumber: updatedUser.mobileNumber || '',
            role: updatedUser.role,
            profilePicture: updatedUser.profilePicture || null,
            isGoogleUser: !!updatedUser.googleId
        });
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({ message: error.message || 'Error updating profile' });
    }
};

module.exports = {
    getUsers,
    updateUser,
    deleteUser,
    getProfile,
    updateProfile
};
