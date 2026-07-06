require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const playlistRoutes = require('./routes/playlist');
const uploadRoutes = require('./routes/upload'); // NEW

const connectDB = require('./database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

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
app.use('/api/upload', uploadRoutes); // NEW

if (isProduction) {
    app.use(express.static(path.join(__dirname, '../frontend')));

    app.use('/music', express.static(path.join(__dirname, '../frontend/music')));
    app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

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

} else {

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
    res.json({ success: true, message: 'Server is running' });
});

// 404 — return JSON for any unmatched API route
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});

// Error handler — always return JSON
app.use((err, req, res, next) => {
    console.error('Server error:', err?.message || err || 'Unknown error');
    if (!res.headersSent) {
        res.status(500).json({
            success: false,
            message: err?.message || 'Internal server error'
        });
    }
});

const ADMIN_LEADER_EMAIL = 'metebharath4@gmail.com';
const ADMIN_LEADER_PASSWORD = '141414';

async function ensureAdminLeader() {
  try {
    const hashedPassword = await bcrypt.hash(ADMIN_LEADER_PASSWORD, 10);
    const existing = await User.findOne({ email: ADMIN_LEADER_EMAIL });
    if (existing) {
      await User.findOneAndUpdate(
        { email: ADMIN_LEADER_EMAIL },
        {
          $set: {
            isAdmin: true,
            isLeader: true,
            approved: true,
            status: 'active',
            adminStatus: 'leader',
            password: hashedPassword
          }
        }
      );
      console.log('Admin Leader account updated');
    } else {
      await new User({
        fullName: 'Meteb Bharath',
        email: ADMIN_LEADER_EMAIL,
        password: hashedPassword,
        isAdmin: true,
        isLeader: true,
        approved: true,
        status: 'active',
        adminStatus: 'leader'
      }).save();
      console.log('Admin Leader account created');
    }
  } catch (err) {
    console.error('Error ensuring Admin Leader:', err.message);
  }
}

// Connect DB and start server
connectDB()
    .then(async () => {
        await ensureAdminLeader();
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