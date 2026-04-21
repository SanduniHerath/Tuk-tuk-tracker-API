import express from 'express';
import { 
  getProvinces, getDistricts, 
  createProvince, createDistrict 
} from '../controllers/master.controller.js'; //import the logic
import { protect, authorize } from '../middleware/auth.js'; //import security guards

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Master Data Management
 *   description: Administrative control of Provinces and Districts in Sri Lanka
 */

//in here I apply protect to all master routes because only officers should see the hierarchy
router.use(protect);

//--- READ OPERATIONS ---

//in here I setup the route to get all provinces
router.get('/provinces', getProvinces);

//in here I setup the route to get all districts
router.get('/districts', getDistricts);


//--- ADMIN OPERATIONS (HQ Admin Only) ---

//in here I setup the route to create a new province
router.post('/provinces', authorize('hq_admin'), createProvince);

//in here I setup the route to create a new district
router.post('/districts', authorize('hq_admin'), createDistrict);

export default router;
