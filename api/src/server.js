import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import apiRoutes from './router';
import checkAndSetupAdmin from './utils/adminSetup';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Enable CORS
app.use(cors());

// Enable HTTP request logging
app.use(morgan('dev'));

// Serve static files from static folder
app.use(express.static('static'));

// Parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Register API routes
app.use('/api', apiRoutes);

// Start the server
async function startServer() {
  try {
    const mongoURL = process.env.MONGODB_URI || 'mongodb://localhost/whisperchain_db';
    console.log(`Connecting to ${mongoURL}`);
    await mongoose.connect(mongoURL);
    console.log(`Mongoose connected to: ${mongoURL}`);
    
    // Check if admin exists and set up if needed
    await checkAndSetupAdmin();
    
    const port = process.env.PORT || 9090;
    app.listen(port, () => {
      console.log(`WhisperChain+ API running on port ${port}`);
    });
  } catch (error) {
    console.error('Server startup error:', error.message);
    process.exit(1);
  }
}

startServer();
