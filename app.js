import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';

import connectDB from './src/config/db.js';
import errorHandler from './src/middleware/errorHandler.js';

//in here I connect to my MongoDB Atlas before starting the server
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Develop security middleware
// use helmet() to automatically set secure HTTP headers to every response
// so it protcts against common attacks like XSS, clickjacking, and other web vulnerabilities
app.use(helmet()); 

//in here use cors() to enable cross origin resource sharing therefore it allows other origins to call our API
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

//Develop body parsing middleware
//in here I use express.json() to read JSON sent in req bodies
//as an example when someone sends {"username" : "sanduni", "password": "1480"}
app.use(express.json({limit: '10kb'})); // limit the size of incoming JSON payloads to 10kb to prevent DoS attacks
app.use(express.urlencoded({ extended: true })); // parse URL-encoded data

//Develop request logging middleware
//in here I use morgan() to log incoming HTTP requests to my terminal while developing the API, it helps me to see what requests are coming in and how my API is responding
//as an example when someone makes a GET request to /api/tuktuks, it will log something like "GET /api/tuktuks 200 15ms"
app.use(morgan('dev')); 


// Define a simple health check route for testing the server is alive
// By defining it I can visit http://localhost:3000/health to check if the server is running and responding with a 200 status code and a message "Tuk tuk tracker API is running successfully!"
app.get('/health', (req,res) => {
  res.status(200).json({
    success: true,
    message: 'Tuk-tuk tracker API is running successfully!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});


//In here I handle 404 errors
// if someone tries to access a route that doesnt exit, then this middleware will send a clear msg
app.use((req,res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on this server`,
  })

})

app.use(errorHandler); //this should be the last middleware

// Connect to MongoDB & Start Server
// I use an async function to ensure the database is connected BEFORE the server starts listening
const startServer = async () => {
    try {
        await connectDB(); // Wait for MongoDB to finish connecting
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Health check available at: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1); // Stop the app if it can't connect to the database
    }
};


startServer();

export default app;