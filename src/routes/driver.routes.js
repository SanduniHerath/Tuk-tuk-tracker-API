import express from 'express';
import {
  getDrivers, getDriver, createDriver, updateDriver, deleteDriver
} from '../controllers/driver.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

//in here I setup the protect middleware to protect all the routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Driver Management
 *   description: Official registry of tuk tuk drivers within the Sri Lanka Police system
 */

router.route('/')
  .get(getDrivers) //any officer can view tuk tuk drivers
  .post(createDriver); //any officer can register a new tuk tuk driver

router.route('/:id')
  .get(getDriver)
  .patch(updateDriver)
  .delete(authorize('hq_admin'), deleteDriver); //only hq admin can delete a tuk tuk driver

export default router;
