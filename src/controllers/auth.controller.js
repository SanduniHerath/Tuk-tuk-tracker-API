import jwt from 'jsonwebtoken'; //create JWT tokens
import { User } from '../models/index.js'; //to look up users in the database

/**
 * HELPER: SIGN TOKEN 
 * Used to create a unique "Security Badge" for an officer.
 */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/**
 * @desc    Register a new Police Officer
 * @route   POST /api/v1/auth/register
 * @access  Private/Admin Only (hq_admin)
 */
export const register = async (req, res, next) => {
  try {
    //in here, I create the user in the db using the data from the request body
    const newUser = await User.create(req.body);

    //send a 201 "Created" response
    res.status(201).json({ 
      success: true, 
      message: 'New officer registered successfully.',
      data: { id: newUser._id, username: newUser.username, role: newUser.role } 
    });
  } catch (error) {
    next(error); //pass error to the central error handler
  }
};

/**
 * @desc    Login to the Tracker System
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    //check if both username and password were sent
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both username and password' });
    }

    //find user in db and include the password field for comparison
    const user = await User.findOne({ username }).select('+password');

    //check if user exists and if the password matches
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Access Denied.' });
    }

    //create the token and send it back
    const token = signToken(user._id);
    res.status(200).json({ 
      success: true, 
      token, 
      role: user.role,
      message: `Welcome back, ${user.username}` 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get profile of currently logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  //return user data attached by the protect middleware
  res.status(200).json({ success: true, data: req.user });
};
