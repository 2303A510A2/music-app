require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const playlistRoutes = require('./routes/playlist');
const connectDB = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Custom MIME types
express.static.mime.define({ 'audio/mpeg': ['mpeg', 'mp3', 'mpga'] });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/playlist', playlistRoutes);

// Serve React build in production
if (isProduction) {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.use('/music', express.static(path.join(__dirname, '../frontend/music')));
    app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

    app.get('*', (req, res) => {
        res.sendFile(
            path.join(__dirname, '../client/dist/index.html')
        );
    });
} else {
    // Serve legacy frontend for development
    app.use(
        express.static(path.join(__dirname, '../frontend'), {
            maxAge: 0
        })
    );

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/login.html'));
    });

    app.get('/register', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/register.html'));
    });

    app.get('/forgot-password', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/forgot-password.html'));
    });

    app.get('/reset-password', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/reset-password.html'));
    });

    app.get('/dashboard', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
    });
}

// Health check route
app.get('/health', (req, res) => {
    res.status(200).send('Server is running');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal server error'
    });
});

// Connect DB and start server
connectDB()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
            console.log(
                `Mode: ${
                    isProduction
                        ? 'production (React)'
                        : 'development (legacy frontend)'
                }`
            );
        });
    })
    .catch((err) => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });