import express from 'express';
import Service from '../models/Service.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get featured services (Public)
router.get('/featured', async (req, res) => {
    try {
        const services = await Service.find({ isActive: true })
            .limit(6)
            .populate('providerId', 'name rating');
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all services
router.get('/', async (req, res) => {
    try {
        const { q, category, price } = req.query;

        const filter = { isActive: true };
        if (q) {
            filter.title = { $regex: q, $options: 'i' };
        }
        if (category) {
            filter.category = category;
        }
        if (price) {
            const [min, max] = price.split('-').map(Number);
            filter.price = {};
            if (!isNaN(min)) filter.price.$gte = min;
            if (!isNaN(max)) filter.price.$lte = max;
        }

        const services = await Service.find(filter).populate('providerId', 'name rating');
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate('providerId', 'name rating');
        if (!service) {
            return res.status(404).json({ message: 'Serviço não encontrado' });
        }
        res.json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create service (Protected, Provider only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.userRole !== 'provider') {
            return res.status(403).json({ message: 'Only providers can create services' });
        }

        const service = new Service({
            ...req.body,
            providerId: req.userId
        });

        await service.save();
        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
