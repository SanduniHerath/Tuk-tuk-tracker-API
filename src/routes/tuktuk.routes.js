import express from 'express';
import {
  getTuktuks, getTuktuk, createTuktuk, updateTuktuk, deleteTuktuk
} from '../controllers/tuktuk.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

//in here, I protect all the tuk tuk routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Tuk Tuk Management
 *   description: Official registry of tuk tuk vehicles being tracked by the system
 */

router.route('/')
  .get(getTuktuks) //any officer can search tuk tuks
  .post(createTuktuk); //any officer can register a new tuk tuk

router.route('/:id')
  .get(getTuktuk)
  .patch(updateTuktuk)
  .delete(authorize('hq_admin'), deleteTuktuk); //only hq admin can delete a tuktuk

export default router;
