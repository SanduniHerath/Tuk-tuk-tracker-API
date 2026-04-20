/*
 This is my global error handler Middleware
 Any error that happens in a route gets sent here to be formatted into a clean JSON response.
 */

const errorHandler = (err, req, res, next) => {
  // log the error to the terminal
  console.error('ERROR STACK:', err.stack);

  // set default error details if they are missing
  let statusCode = err.statusCode || 500; // 500 = Internal Server Error
  let message = err.message || 'Something went wrong on the server';

  //Handle mongoose related errors
  
  // handle when a user tries to enter a duplicate value for a unique field
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${field}. Please use uniwue value!`;
  }

  // handle when a user uses an invalid MongoDB ObjectID
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id of ${err.value}`;
  }

  // handle when a user misses a required field
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  //Handle JWT related errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  //Send the clean JSON response to the user
  res.status(statusCode).json({
    success: false,
    message: message,
    // We only show the stack trace if we are in development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler;
