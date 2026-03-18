import mongoose from 'mongoose';

/**
 * Attendance – persists each check-in / check-out event for a job shift.
 * Complements the lightweight checkin data already stored on the Job document.
 */
const attendanceSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    checkInTime: {
      type: Date,
      required: true,
    },
    checkInLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    checkOutLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    proofPhotoUrl: {
      type: String,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: null,
      min: [0, 'Duration cannot be negative'],
    },
    status: {
      type: String,
      enum: ['checked_in', 'checked_out', 'approved', 'disputed', 'no_show'],
      default: 'checked_in',
    },
    employerApprovedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// At most one active attendance record per freelancer per job
attendanceSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });
attendanceSchema.index({ freelancerId: 1, checkInTime: -1 });
attendanceSchema.index({ status: 1 });

export default mongoose.model('Attendance', attendanceSchema);
