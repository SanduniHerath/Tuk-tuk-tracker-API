import express from 'express';
import {
  getTuktuks, getTuktuk, createTuktuk, updateTuktuk, deleteTuktuk
} from '../controllers/tuktuk.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

//in here, I protect all the tuk tuk routes
router.use(protect);

router.get('/', getTuktuks);

router.get('/:regNo', getTuktuk);

router.post('/', authorize('hq_admin', 'provincial_officer'), createTuktuk);

router.put('/:regNo', authorize('hq_admin', 'provincial_officer', 'station_officer'), updateTuktuk);

router.delete('/:regNo', authorize('hq_admin'), deleteTuktuk);

export default router;
