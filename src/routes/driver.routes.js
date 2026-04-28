import express from 'express';
import {
  getDrivers, getDriver, createDriver, updateDriver, deleteDriver
} from '../controllers/driver.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getDrivers);

router.get('/:nic', getDriver);

router.post('/', protectauthorize('hq_admin', 'tuk_tuk_operator'), createDriver);

router.put('/:nic', protect, authorize('hq_admin', 'tuk_tuk_operator'), updateDriver);

router.delete('/:nic', protect, authorize('hq_admin', 'tuk_tuk_operator'), deleteDriver);

export default router;
