import mongoose from 'mongoose';

/**
 * CompanyProfile – extended employer details, separate from the User document.
 * One-to-one with User (role: 'employer').
 */
const companyProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [120, 'Company name cannot exceed 120 characters'],
    },
    cnpj: {
      type: String,
      default: null,
      trim: true,
      match: [/^\d{14}$/, 'CNPJ must contain exactly 14 digits'],
    },
    industry: {
      type: String,
      enum: ['Gastronomia', 'Construção', 'Eventos', 'Serviços Gerais', 'Outros'],
      required: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    website: {
      type: String,
      default: null,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    employeeCount: {
      type: Number,
      default: null,
      min: [1, 'Employee count must be at least 1'],
    },
    foundedYear: {
      type: Number,
      default: null,
      min: [1900, 'Founded year must be after 1900'],
      max: [new Date().getFullYear(), 'Founded year cannot be in the future'],
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    totalJobsPosted: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalJobsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

companyProfileSchema.index({ userId: 1 });
companyProfileSchema.index({ cnpj: 1 }, { sparse: true });
companyProfileSchema.index({ verificationStatus: 1 });

export default mongoose.model('CompanyProfile', companyProfileSchema);
