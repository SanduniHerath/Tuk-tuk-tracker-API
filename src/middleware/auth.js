import jwt from 'jsonwebtoken'; // Industry standard for creating secure tokens
import { User } from '../models/index.js'; // To look up users in the database

/**
 * PROTECT MIDDLEWARE
 * This stands guard at the door. If a user doesn't have a valid JWT, 
 * they cannot enter.
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check the "Authorization" header for the token
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access Denied. No security token provided.' });
    }

    // 2. Decode the token using your secret key from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find the user in the DB and attach them to the request object
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
    }

    // 4. Everything is fine! Let the user through
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * AUTHORIZE MIDDLEWARE (RBAC)
 * This checks your "Role". An Officer cannot access HQ Admin files.
 */
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
