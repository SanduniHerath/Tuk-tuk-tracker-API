import express from 'express';
import { register, login, getMe, updateUser, deleteUser, getAllUsers, getUser } from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.js';//import security middleware

const router = express.Router();



router.post('/register', protect, authorize('hq_admin'), register);

router.get('/getUsers', protect, authorize('hq_admin'), getAllUsers);

router.get('/getUser/:username', protect, authorize('hq_admin'), getUser);

router.patch('/update/:username', protect, authorize('hq_admin'), updateUser);

router.delete('/delete/:username', protect, authorize('hq_admin'), deleteUser);

router.post('/login', login);

router.get('/current-user', protect, getMe);

export default router;
