import { Router } from 'express';
import * as goalController from '../controllers/goalController.js';
import { authenticate, requireActiveAccount } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createGoalSchema, updateGoalSchema } from '../validations/goalValidation.js';

const router = Router();

router.post('/', authenticate, requireActiveAccount, validate(createGoalSchema), goalController.create);
router.get('/', authenticate, goalController.getMyGoals);
router.patch('/:id', authenticate, requireActiveAccount, validate(updateGoalSchema), goalController.update);
router.delete('/:id', authenticate, requireActiveAccount, goalController.cancel);

export default router;
