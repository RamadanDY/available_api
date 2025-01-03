import { Schema, model } from 'mongoose';

const feedbackSchema = new Schema(
  {
    message: { type: String, required: true },
    representativeId: String,
    representativeName: String,
    representativeCourse: String,
    representativeLevel: String,
  },
  { timestamps: true }
);

feedbackSchema.set('toJSON', { virtuals: true });
feedbackSchema.set('toObject', { virtuals: true });

const Feedback = model('Feedback', feedbackSchema);

export default Feedback;
