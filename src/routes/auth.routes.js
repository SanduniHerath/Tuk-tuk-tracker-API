import express from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js'; //import controller logic
import { protect, authorize } from '../middleware/auth.js'; //import security middleware

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: login & user management of the Tuk-Tuk Tracker System
 */

//in here I setup the register route. Only HQ Admin can register new officers
//re-locked after creating the first admin
router.post('/register', protect, authorize('hq_admin'), register);

//in here I setup the login route. open to everyone
router.post('/login', login);

//in here I setup the me route to get the logged in user's profile
router.get('/me', protect, getMe);

export default router;
