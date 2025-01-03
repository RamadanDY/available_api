import createHttpError from 'http-errors';
import Feedback from '../models/feedback.js';

export async function leaveFeedback(req, res, next) {
  const { message } = req.body;
  if (!message) {
    next(createHttpError(400, 'Missing required field: message'));
    return;
  }
  try {
    const feedback = await Feedback.create(req.body);

    if (!feedback) {
      next(
        createHttpError(500, 'Could not submit feedback. Please try again.')
      );
      return;
    }

    res.status(201).json(feedback);
  } catch (error) {
    console.trace(error);
    next(error);
  }
}
