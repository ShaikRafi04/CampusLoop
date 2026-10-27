import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authenticate, requireActiveAccount } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createReviewSchema } from '../validations/reviewValidation.js';

const router = Router();

router.post('/', authenticate, requireActiveAccount, validate(createReviewSchema), reviewController.create);
router.get('/user/:userId', reviewController.getUserReviews);

export default router;
