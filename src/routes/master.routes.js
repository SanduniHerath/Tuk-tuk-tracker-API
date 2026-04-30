import express from 'express';
import {
  getProvinces, getProvince, updateProvince, deleteProvince,
  getDistricts, getDistrict, updateDistrict, deleteDistrict,
  getStations, getStation, createStation, updateStation, deleteStation
} from '../controllers/master.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/provinces', protect, authorize('hq_admin', 'provincial_officer', 'station_officer'), getProvinces);

router.get('/provinces/:name', protect, authorize('hq_admin', 'provincial_officer', 'station_officer'), getProvince);

router.patch('/provinces/:name', protect, authorize('hq_admin', 'provincial_officer'), updateProvince);

router.delete('/provinces/:name', protect, authorize('hq_admin', 'provincial_officer'), deleteProvince);

router.get('/districts', protect, authorize('hq_admin', 'provincial_officer', 'station_officer'), getDistricts);

router.get('/districts/:name', protect, authorize('hq_admin', 'provincial_officer', 'station_officer'), getDistrict);

router.patch('/districts/:name', protect, authorize('hq_admin'), updateDistrict);

router.delete('/districts/:name', protect, authorize('hq_admin'), deleteDistrict);

router.post('/stations', protect, authorize('hq_admin', 'station_officer'), createStation);

router.get('/stations', protect, authorize('hq_admin', 'provincial_officer', 'station_officer'), getStations);

router.get('/stations/:code', protect, authorize('hq_admin', 'provincial_officer', 'station_officer'), getStation);

router.patch('/stations/:code', protect, authorize('hq_admin', 'station_officer'), updateStation);

router.delete('/stations/:code', protect, authorize('hq_admin'), deleteStation);

export default router;
