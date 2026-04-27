import express from 'express';
import { register, login, getMe, updateUser, deleteUser } from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.js';//import security middleware

const router = express.Router();

//in here I setup the register route. Only HQ Admin can register new officers
router.post('/register', protect, authorize('hq_admin'), register);

router.put('/update/:id', protect, authorize('hq_admin'), updateUser);

router.delete('/delete/:id', protect, authorize('hq_admin'), deleteUser);

//in here I setup the login route. open to everyone
router.post('/login', login);

//in here I setup the me route to get the logged in user's profile
router.get('/me', protect, getMe);

export default router;
