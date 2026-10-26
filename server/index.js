/**
 * AgriGuardian Private Limited — Internal Enterprise Backend
 * Node.js + Express + MongoDB MERN Architecture
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agriguardian_portal';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected for AgriGuardian Enterprise Portal'))
  .catch(err => console.warn('MongoDB connection note (Running in dev fallback mode):', err.message));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    enterprise: 'AgriGuardian Private Limited',
    udyam: 'UDHAYAM-TN-02-0407122',
    timestamp: new Date().toISOString()
  });
});

// Import and mount modular routes
// app.use('/api', require('./routes/api'));

app.listen(PORT, () => {
  console.log(`AgriGuardian MERN Backend running on http://127.0.0.1:${PORT}`);
});
