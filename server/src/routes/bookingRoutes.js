import { Router } from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { authenticate, requireActiveAccount } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createBookingSchema,
  cancelBookingSchema,
} from '../validations/bookingValidation.js';

const router = Router();

router.post('/', authenticate, requireActiveAccount, validate(createBookingSchema), bookingController.requestBooking);
router.get('/me', authenticate, bookingController.getMyBookings);
router.get('/:id', authenticate, bookingController.getById);

router.patch('/:id/accept', authenticate, requireActiveAccount, bookingController.accept);
router.patch('/:id/reject', authenticate, requireActiveAccount, bookingController.reject);
router.patch('/:id/cancel', authenticate, requireActiveAccount, validate(cancelBookingSchema), bookingController.cancel);
router.patch('/:id/complete', authenticate, requireActiveAccount, bookingController.complete);
router.patch('/:id/confirm', authenticate, requireActiveAccount, bookingController.confirm);

export default router;
