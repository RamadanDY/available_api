import express from 'express';
import { leaveFeedback } from '../controllers/feedback.js';

const router = express.Router();

router.post('/', leaveFeedback);

export default router;
