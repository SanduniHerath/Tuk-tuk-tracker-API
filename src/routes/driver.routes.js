import express from 'express';
import {
  getDrivers, getDriver, createDriver, updateDriver, deleteDriver
} from '../controllers/driver.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getDrivers);

router.get('/:nic', getDriver);

router.post('/', protect, authorize('hq_admin', 'station_officer'), createDriver);

router.patch('/:nic', protect, authorize('hq_admin', 'station_officer'), updateDriver);

router.delete('/:nic', protect, authorize('hq_admin'), deleteDriver);

export default router;
