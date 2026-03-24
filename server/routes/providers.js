import express from 'express';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// =====================
// Rotas pÃºblicas
// =====================
// Get featured providers (Public)
router.get('/featured', async (req, res) => {
    try {
        const providers = await User.find({
            role: 'provider',
            isVerified: true
        })
        .sort({ rating: -1 })
        .limit(4)
        .select('-password');
        res.json(providers);
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
        const reviews = await Appointment.find({
            providerId,
            review: { $exists: true, $ne: null }
        })
        .select('rating review createdAt clientId serviceId')
        .populate('clientId', 'name')
        .populate('serviceId', 'title');

        const count = reviews.length;
        const avg = count ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count) : 0;

        res.json({
            averageRating: Number(avg.toFixed(2)),
            reviewsCount: count,
            reviews
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// =====================
// Rotas protegidas
// =====================
// Apenas prestadores podem acessar estas rotas
router.use(auth, authorize('provider'));

// Update provider-specific profile
router.patch('/:id/profile', async (req, res) => {
    try {
        if (req.userId !== req.params.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { profile } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    'profile.bio': profile.bio,
                    'profile.specialty': profile.specialty,
                    'profile.experience': profile.experience,
                    'profile.consultationFee': profile.consultationFee,
                    'profile.qualifications': profile.qualifications,
                    'profile.languages': profile.languages,
                    'profile.servicesOffered': profile.servicesOffered
                }
            },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update provider availability
router.patch('/:id/availability', async (req, res) => {
    try {
        if (req.userId !== req.params.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { availability } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { 'profile.availability': availability },
            { new: true }
        ).select('-password');
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
