import mongoose from 'mongoose';

const consentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
  },
  legalBasis: {
    type: String,
    default: 'consent',
    trim: true,
  },
  granted: {
    type: Boolean,
    required: true,
    default: true,
  },
  policyVersion: {
    type: String,
    default: null,
  },
  source: {
    type: String,
    default: 'app',
  },
  revokedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

consentSchema.index({ userId: 1, purpose: 1, policyVersion: 1 });
consentSchema.index({ granted: 1 });

consentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Consent', consentSchema);
