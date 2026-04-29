import express from 'express';
import { submitPing, getLatestLocation, getHistory, getDistrictLatest, getAllLatestLocations } from '../controllers/location.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/ping', protect, authorize('gps_device', 'hq_admin'), submitPing);

router.get('/latest', protect, authorize('hq_admin', 'provincial_officer', 'station_officer'), getAllLatestLocations);

router.get('/district/:districtName', protect, authorize('hq_admin', 'provincial_officer', 'station_officer'), getDistrictLatest);

router.get('/:regNo/latest', protect, authorize('hq_admin', 'provincial_officer', 'station_officer'), getLatestLocation);

router.get('/:regNo/history', protect, authorize('hq_admin', 'provincial_officer', 'station_officer'), getHistory);

export default router;