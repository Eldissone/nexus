import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  scheduledDate: { type: Date, required: true },
  scheduledTime: String,
  address: {
    type: String,
    required: true
  },
  notes: String,
  symptoms: [String],
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  duration: Number,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  rating: Number,
  review: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  completedAt: Date
});

export default mongoose.model('Appointment', appointmentSchema);
