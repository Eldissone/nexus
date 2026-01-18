import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import Appointment from '../models/Appointment.js';

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

// Get provider by id (Public)
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user || user.role !== 'provider') {
            return res.status(404).json({ message: 'Provider not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get provider reviews summary and list (Public)
router.get('/:id/reviews', async (req, res) => {
    try {
        const providerId = req.params.id;
        const reviews = await Appointment.find({ providerId, review: { $exists: true, $ne: null } })
            .select('rating review createdAt clientId serviceId')
            .populate('clientId', 'name')
            .populate('serviceId', 'title');

        const count = reviews.length;
        const avg = count ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count) : 0;

        res.json({ averageRating: Number(avg.toFixed(2)), reviewsCount: count, reviews });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
