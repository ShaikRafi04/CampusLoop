import { Router } from 'express';
import * as availabilityController from '../controllers/availabilityController.js';
import { authenticate, requireActiveAccount } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
} from '../validations/availabilityValidation.js';

const router = Router();

router.get('/me', authenticate, availabilityController.getMyAvailability);
router.get('/:mentorId', availabilityController.getMentorAvailability);

router.post('/', authenticate, requireActiveAccount, validate(createAvailabilitySchema), availabilityController.create);
router.patch('/:id', authenticate, requireActiveAccount, validate(updateAvailabilitySchema), availabilityController.update);
router.delete('/:id', authenticate, requireActiveAccount, availabilityController.remove);

export default router;
