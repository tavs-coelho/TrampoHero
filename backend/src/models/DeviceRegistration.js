import mongoose from 'mongoose';

/**
 * Stores a device push token so the server can send targeted notifications.
 *
 * Tags are used by Azure Notification Hubs to route messages to groups of
 * devices (e.g. role:freelancer, niche:Gastronomia).
 */
const deviceRegistrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** Platform-specific push token (Expo / FCM / APNs). */
    pushToken: {
      type: String,
      required: true,
      trim: true,
    },
    /** Device platform. */
    platform: {
      type: String,
      enum: ['ios', 'android', 'expo'],
      required: true,
    },
    /** Azure Notification Hubs registration ID (set after registration). */
    nhRegistrationId: {
      type: String,
      default: null,
    },
    /**
     * Tag expressions used to route pushes to this device.
     * Examples: ["role:freelancer", "niche:Gastronomia"]
     */
    tags: {
      type: [String],
      default: [],
    },
    /** Whether this registration is still active. */
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One active registration per user per push token
deviceRegistrationSchema.index({ user: 1, pushToken: 1 }, { unique: true });

export default mongoose.model('DeviceRegistration', deviceRegistrationSchema);
