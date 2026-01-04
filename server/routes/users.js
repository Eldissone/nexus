import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get featured providers (Public)
router.get('/featured', async (req, res) => {
    try {
        // Find users with role 'provider' and high rating, limit to 4
        const providers = await User.find({ role: 'provider' })
            .sort({ rating: -1 })
            .limit(4)
            .select('-password');
        res.json(providers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user profile (Protected)
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
