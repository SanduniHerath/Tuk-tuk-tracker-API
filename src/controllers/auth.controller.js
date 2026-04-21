import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

//in here I setup a helper function to create a JWT token which is used to
//create a unique security badge for an officer
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });


/**
 * @desc    Register a new police officer
 * @route   POST /api/v1/auth/register
 * @access  Private
 */
export const register = async (req, res, next) => {
  try {
    //in here, I create the user in the db using the data from the request body
    const newUser = await User.create(req.body);

    //send a success message through 201 status code
    res.status(201).json({
      success: true,
      message: 'New officer registered successfully.',
      data: { id: newUser._id, username: newUser.username, role: newUser.role }
    });
  } catch (error) {
    next(error);//pass error to the central error handler
  }
};


/**
 * @desc    Login a police officer
 * @route   POST /api/v1/auth/login
 * @access  Private
 */
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    //check weather both username and password were sent
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both username and password' });
    }

    //find the user in db and include the password field for comparison
    const user = await User.findOne({ username }).select('+password');

    //here check whether the user exist and if the password matches
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
  //return user data 
  res.status(200).json({ success: true, data: req.user });
};
