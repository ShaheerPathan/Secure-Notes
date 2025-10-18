require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');

const app = express();

// ✅ Middleware setup
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression for faster responses

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

// ✅ MongoDB connection
const mongoURL = process.env.MONGO_URL;
if (!mongoURL) {
    console.error('❌ MONGO_URL not found in .env');
    process.exit(1);
}

mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// ✅ Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// ✅ Clean URL routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ✅ 404 fallback
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// ✅ Start server
const PORT = process.env.BACKEND_PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SecureNotes backend running on port ${PORT}`);
});
