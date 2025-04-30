import express, { Express } from 'express';
import dotenv from 'dotenv';
import { dbConnection } from '../config/db';
import authRoutes from '../routes/auth';
import attendanceRoutes from '../routes/attendance';
import classRoutes from '../routes/class';
import exportRoutes from '../routes/export';
import { errorHandler } from '../middlewares/errorHandler';
import logger from '../utils/logger';
import cors from 'cors';
import sectionRouter from '../routes/section';
import qrCodeRouter from '../routes/qrCode';
import { networkInterfaces } from 'os';
import https from 'https'; // Import HTTPS
import fs from 'fs'; // Import FileSystem for reading SSL files

dotenv.config();

// Initialize Express app
const app: Express = express();

// Define port and host with fallbacks
const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '192.168.0.11'; // Listen on all interfaces by default

// Get local network IP for display purposes
const getLocalIP = (): string => {
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    const net = nets[name];
    if (!net) continue;
    
    for (const interface_ of net) {
      // Skip internal and non-IPv4 addresses
      if (interface_.family === 'IPv4' && !interface_.internal) {
        return interface_.address;
      }
    }
  }
  return '192.168.0.11';
};

const localIP = getLocalIP();

// Configure CORS properly - allow both localhost and local network
const allowedOrigins = [
  'https://localhost:3000',
  `https://${localIP}:3000`
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Connect to the database
dbConnection()

// Define API routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/qrcodes', qrCodeRouter);
app.use('/api/class', classRoutes);
app.use('/api/sections', sectionRouter);
app.use('/api/export', exportRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('University Attendance System is running!');
});

// Global error handling middleware
app.use(errorHandler);

// Load SSL Certificate and Key
const sslOptions = {
  key: fs.readFileSync('./localhost-key.pem'), // Replace with your key file
  cert: fs.readFileSync('./localhost.pem') // Replace with your cert file
};

// Start the HTTPS server
https.createServer(sslOptions, app).listen(PORT, HOST, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Local access: https://localhost:${PORT}`);
  logger.info(`Network access: https://${localIP}:${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}, Stack: ${err.stack}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}, Stack: ${err.stack}`);
  process.exit(1);
});