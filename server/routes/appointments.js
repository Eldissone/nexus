import express from 'express';
import Appointment from '../models/Appointment.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Criar novo agendamento
router.post('/', auth, async (req, res) => {
    try {
        const appointment = new Appointment({
            ...req.body,
            clientId: req.userId,
            status: 'pending'
        });

        await appointment.save();
        
        // Notificar o prestador via WebSocket
        // Implementação na rota real
        
        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/availability', async (req, res) => {
    try {
        const { providerId, date } = req.query;
        if (!providerId || !date) {
            return res.status(400).json({ message: 'providerId e date são obrigatórios' });
        }

        // Normalizar data para o dia inteiro
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        // Buscar agendamentos existentes do prestador nesse dia
        const existing = await Appointment.find({
            providerId,
            scheduledDate: { $gte: dayStart, $lte: dayEnd }
        }).select('scheduledTime');

        const bookedTimes = new Set(existing.map(a => a.scheduledTime).filter(Boolean));

        // Gerar slots padrão (09:00–17:00 a cada 60 min)
        const slots = [];
        for (let hour = 9; hour <= 16; hour++) {
            const h = hour.toString().padStart(2, '0');
            const t = `${h}:00`;
            if (!bookedTimes.has(t)) slots.push(t);
        }

        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Atualizar status do agendamento (para prestadores)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        
        if (appointment.providerId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Não autorizado' });
        }

        appointment.status = req.body.status;
        appointment.updatedAt = new Date();
        
        if (req.body.status === 'completed') {
            appointment.completedAt = new Date();
        }

        await appointment.save();
        
        // Emitir evento de atualização via WebSocket
        // req.io.to(appointment._id.toString()).emit('status-updated', appointment);
        
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Buscar agendamentos do usuário
router.get('/my-appointments', auth, async (req, res) => {
    try {
        const query = req.userRole === 'provider' 
            ? { providerId: req.userId }
            : { clientId: req.userId };
        
        const appointments = await Appointment.find(query)
            .populate('serviceId')
            .populate(req.userRole === 'provider' ? 'clientId' : 'providerId')
            .sort('-createdAt');
        
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
