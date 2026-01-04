import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { 
    type: String,
    enum: ['consultation', 'homeCare', 'nursing', 'physiotherapy', 'laboratory', 'pharmacy']
  },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price: Number,
  duration: Number, // em minutos
  isActive: { type: Boolean, default: true },
  requirements: [String],
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Service', serviceSchema);
