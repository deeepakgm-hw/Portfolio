const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const projectRoutes = require('./routes/projectRoutes');
const contactRoutes = require('./routes/contactRoutes');
const profileRoutes = require('./routes/profileRoutes');
const errorHandler = require('./middleware/errorHandler');

// Initialize database
require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxies (Render, Cloudflare, etc.) to resolve real client IP
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in dev
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Static files for client
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// API Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Mount API routes
app.use('/api/projects', projectRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/profile', profileRoutes);

// Explicit Admin Route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(clientPath, 'admin/index.html'));
});

// Fallback to client/index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 Portfolio server active on: http://localhost:${PORT}`);
    console.log(`🛠️  Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`📦 REST API Health: http://localhost:${PORT}/api/health`);
    console.log(`========================================`);
  });
}

module.exports = app;
