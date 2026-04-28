import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';

//in here I setup a helper function to create a JWT token which is used to
//create a unique security badge for an officer
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const register = async (req, res, next) => {
  try {
    //in here, I create the user in the db using the data from the request body
    const newUser = await User.create(req.body);
    res.status(201).json({
      success: true,
      data: { id: newUser._id, username: newUser.username, role: newUser.role }
    });
  } catch (error) {
    next(error);
  }
};

//get all users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

//get user by username
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

//update user by username
export const updateUser = async (req, res, next) => {
  try {

    //if the password is being updated, hash it before saving to the database
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const updatedUser = await User.findOneAndUpdate(
      { username: req.params.username },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role
      }
    });

  } catch (error) {
    next(error);
  }
};

//delete user by username
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOneAndDelete(
      { username: req.params.username },
      req.body,
      { new: true, runValidators: true }
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

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

export const getMe = async (req, res, next) => {
  //return user data 
  res.status(200).json({ success: true, data: req.user });
};
