import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate, requireActiveAccount } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { updateProfileSchema } from '../validations/userValidation.js';

const router = Router();

router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, requireActiveAccount, validate(updateProfileSchema), userController.updateMe);
router.get('/me/profile-completion', authenticate, userController.getProfileCompletion);
router.get('/:id', userController.getPublicProfile);

export default router;
