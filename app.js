import express from 'express';
import cors from 'cors'; //cross origin resource sharing
import helmet from 'helmet'; //security headers
import morgan from 'morgan'; //req logging
import rateLimit from 'express-rate-limit'; //ddos protection
import 'dotenv/config';

import connectDB from './src/config/db.js';
import swaggerSetup from './src/config/swagger.js';
import errorHandler from './src/middleware/errorHandler.js';

//import all the routes
import authRoutes from './src/routes/auth.routes.js';
import masterRoutes from './src/routes/master.routes.js';
import driverRoutes from './src/routes/driver.routes.js';
import tuktukRoutes from './src/routes/tuktuk.routes.js';
import locationRoutes from './src/routes/location.routes.js';

//initialize express
const app = express();

const PORT = process.env.PORT || 3000;

//setup global security and logging middleware
//this protects the server before handling any data
app.use(helmet({ contentSecurityPolicy: false })); //in here I disable CSP so that swagger load correctly
app.use(cors());//allow all origins
app.use(express.json({ limit: '10kb' })); //set safety limit of 10kb to prevent large payloads from crashing the server 
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); //in here I set the morgan to log requests in production mode and in development mode it will log all the requests


//here I setup rate limiting to prevent ddos attacks 
//to 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please wait 15 minutes.' }
});
app.use('/api', limiter);//only apply to api routes

swaggerSetup(app);

//in here, I setup all the routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/master', masterRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/tuktuks', tuktukRoutes);
app.use('/api/v1/locations', locationRoutes);

//here I setup a health check route to verify the cloud deployment is live
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    timestamp: new Date(),
    message: 'Tuk-Tuk Tracker API Foundation is stable.'
  });
});


//404 handler for undefined URLS
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

//use central error handler
app.use(errorHandler);

//in here, I ensure that the db is connected before the server opens its ports
const startServer = async () => {
  try {
    await connectDB();//ensure db is ready
    app.listen(PORT, () => {
      console.log(`Foundation Server running on port ${PORT}`);
      console.log(`API Specs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('CRITICAL: Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;