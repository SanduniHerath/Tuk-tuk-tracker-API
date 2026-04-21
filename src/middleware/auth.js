import jwt from 'jsonwebtoken'; //create JWT tokens
import { User } from '../models/index.js'; //to look up users in the database

//in here I setup the protect middleware which checks if the user has a valid JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    //check the authorization header for the token
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access Denied. Not authorized.' });
    }

    //decode the token from my env secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //find the user in db and attach them to the request object
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
    }

    //let the user through to the next middleware
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

//in here I setup the authorize middleware which checks the role of the user - RBAC
//as an example an officer cannot access HQ admin files
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Your role (${req.user.role}) is not authorized to access this route.`
      });
    }
    next();
  };
};
