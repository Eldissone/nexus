export class NotificationService {
    constructor(io) {
        this.io = io;
    }

    async sendAppointmentNotification(appointment, type) {
        const { clientId, providerId } = appointment;
        
        const messages = {
            'created': {
                toProvider: 'Novo agendamento solicitado',
                toClient: 'Agendamento solicitado com sucesso'
            },
            'confirmed': {
                toClient: 'Seu agendamento foi confirmado'
            },
            'cancelled': {
                toProvider: 'Agendamento cancelado pelo paciente',
                toClient: 'Agendamento cancelado'
            },
            'reminder': {
                toClient: 'Lembrete: Seu agendamento é amanhã',
                toProvider: 'Lembrete: Você tem um agendamento amanhã'
            }
        };

        // Enviar para cliente
        if (messages[type]?.toClient) {
            this.io.to(`user-${clientId}`).emit('notification', {
                type,
                message: messages[type].toClient,
                appointmentId: appointment._id,
                timestamp: new Date()
            });
        }

        // Enviar para prestador
        if (messages[type]?.toProvider) {
            this.io.to(`user-${providerId}`).emit('notification', {
                type,
                message: messages[type].toProvider,
                appointmentId: appointment._id,
                timestamp: new Date()
            });
        }
    }

    async sendNewMessageNotification(roomId, senderId, message) {
        // Notificar todos na sala exceto o remetente
        this.io.to(roomId).except(senderId).emit('new-message-notification', {
            roomId,
            senderId,
            preview: message.slice(0, 100),
            timestamp: new Date()
        });
    }
}