const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: "*"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Attach Socket.io to request for use in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Initialize Tactical Uplink Service
const SocketService = require('./src/services/socketService');
const socketService = new SocketService(io);

// Initialize Automated Intelligence Service
// Initialize Automated Intelligence Service
const notificationService = require('./src/services/notificationService');

// Expose services globally or attach to app if needed
app.set('socketService', socketService);
app.set('notificationService', notificationService);

// Attach services to request
app.use((req, res, next) => {
    req.io = io;
    req.socketService = socketService;
    req.notificationService = notificationService;
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/teams', require('./src/routes/teamRoutes'));
app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
app.use('/api/results', require('./src/routes/resultRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/disputes', require('./src/routes/disputeRoutes'));
app.use('/api/seasons', require('./src/routes/seasonRoutes'));
app.use('/api/live', require('./src/routes/liveRoutes'));
app.use('/api/announcements', require('./src/routes/announcementRoutes'));
app.use('/api/achievements', require('./src/routes/achievementRoutes'));
app.use('/api/recruitment', require('./src/routes/recruitmentRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: "Strategic endpoint not found." });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[SYSTEM ERROR] ${err.stack}`);
    res.status(500).json({
        message: "Internal Tactical Failure.",
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});

const db = require('./src/config/db');

server.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server is LIVE on http://0.0.0.0:${PORT}`);
    try {
        await db.query('SELECT NOW()');
        console.log('Database CONNECTION: SECURED 🛡️');
    } catch (err) {
        console.error('DATABASE ERROR:', err.message);
    }
});
