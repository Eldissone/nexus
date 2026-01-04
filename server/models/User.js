import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['client', 'provider', 'admin'],
    default: 'client'
  },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  // Campos específicos para prestadores
  profile: {
    specialty: String,
    licenseNumber: String,
    experience: Number,
    qualifications: [String],
    bio: String,
    languages: [String],
    servicesOffered: [String],
    consultationFee: Number,
    availability: {
      monday: [{ start: String, end: String }],
      tuesday: [{ start: String, end: String }],
      // ... outros dias
    }
  },
  // Campos específicos para clientes
  healthProfile: {
    bloodType: String,
    allergies: [String],
    medications: [String],
    conditions: [String]
  },
  avatar: String,
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);