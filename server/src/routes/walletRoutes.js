import { Router } from 'express';
import * as walletController from '../controllers/walletController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, walletController.getWallet);
router.get('/transactions', authenticate, walletController.getTransactions);
router.get('/summary', authenticate, walletController.getWalletSummary);

export default router;
