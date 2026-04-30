import express from 'express';
import { getSuspiciousVehicles, getSuspiciousVehiclesByDistrict, getSuspiciousVehiclesByProvince } from '../controllers/location.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get(
    '/suspicious',
    authorize('hq_admin', 'provincial_officer', 'station_officer'),
    getSuspiciousVehicles
);

router.get(
    '/suspicious/district/:districtName',
    authorize('hq_admin', 'provincial_officer', 'station_officer'),
    getSuspiciousVehiclesByDistrict
);

router.get(
    '/suspicious/province/:provinceName',
    authorize('hq_admin', 'provincial_officer', 'station_officer'),
    getSuspiciousVehiclesByProvince
);


export default router;