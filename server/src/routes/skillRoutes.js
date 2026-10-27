import { Router } from 'express';
import * as skillController from '../controllers/skillController.js';
import { authenticate, optionalAuth, requireActiveAccount } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createSkillSchema,
  updateSkillSchema,
  skillQuerySchema,
} from '../validations/skillValidation.js';

import { slotQuerySchema } from '../validations/availabilityValidation.js';

const router = Router();

router.get('/categories', skillController.getCategories);
router.get('/', validate(skillQuerySchema), skillController.list);
router.get('/:id', optionalAuth, skillController.getById);
router.get('/:id/slots', validate(slotQuerySchema), skillController.getSlots);

router.post('/', authenticate, requireActiveAccount, validate(createSkillSchema), skillController.create);
router.patch('/:id', authenticate, requireActiveAccount, validate(updateSkillSchema), skillController.update);
router.delete('/:id', authenticate, requireActiveAccount, skillController.deactivate);

export default router;
