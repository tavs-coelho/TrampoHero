import mongoose from 'mongoose';

const courseQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
}, { _id: false });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  duration: {
    type: String,
    required: true,
  },
  badgeId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    default: 0,
  },
  level: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced', 'certification'],
    default: 'basic',
  },
  provider: String,
  revenueShare: {
    type: Number,
    default: 30,
  },
  niche: {
    type: String,
    enum: ['Gastronomia', 'Construção', 'Eventos', 'Serviços Gerais'],
  },
  examQuestions: [courseQuestionSchema],
  passingScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  certificateIssuer: {
    type: String,
    default: 'TrampoHero Academy',
  },
}, {
  timestamps: true,
});

export default mongoose.model('Course', courseSchema);
