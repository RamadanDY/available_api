import { Router } from 'express';
import {
  bookClass,
  patchBooking,
  cancelClass,
  getBookingsByRepresentativeId,
} from '../controllers/bookings.js';

const router = Router();

router.get('/', getBookingsByRepresentativeId);
router.post('/', bookClass);
router.patch('/:id', patchBooking);
router.delete('/:id', cancelClass);

export default router;
