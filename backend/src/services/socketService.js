const jwt = require('jsonwebtoken');
const db = require('../config/db');

class SocketService {
    constructor(io) {
        this.io = io;
        this.setup();
    }

    setup() {
        // Authentication Middleware for Sockets
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.headers['x-auth-token'];
            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.user = decoded;
                next();
            } catch (err) {
                if (err.name === 'TokenExpiredError') {
                    return next(new Error('Authentication error: Token expired'));
                }
                next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`Operative Linked: ${socket.user.id} (${socket.id})`);

            // 0. Join Personal Room (for targeted notifications)
            socket.join(`user_${socket.user.id}`);
            console.log(`Operative ${socket.user.id} joined personal room`);
            socket.on('join_match', (matchId) => {
                socket.join(`match_${matchId}`);
                console.log(`Operative ${socket.user.id} joined Match_${matchId}`);
            });
            socket.on('join_tournament', (tournamentId) => {
                socket.join(`tournament_${tournamentId}`);
                console.log(`Operative ${socket.user.id} joined Tournament_${tournamentId}`);
            });

            // 2. Squad Comms (Team Chat)
            socket.on('join_squad', async (teamId) => {
                // Verify operative is part of this team
                try {
                    const res = await db.query(
                        'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
                        [teamId, socket.user.id]
                    );

                    if (res.rows.length > 0) {
                        socket.join(`team_${teamId}`);
                        console.log(`Operative ${socket.user.id} joined Squad_${teamId}`);
                        socket.emit('joined_squad', { teamId, success: true });
                    } else {
                        socket.emit('error', { message: 'Clearance Denied: Not a member of this squad.' });
                    }
                } catch (err) {
                    console.error('Socket Join Squad Error:', err);
                }
            });

            // 3. Send Message
            socket.on('send_message', async ({ teamId, content }) => {
                try {
                    // Check membership again for safety
                    const res = await db.query(
                        'SELECT u.ff_ign FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = $1 AND tm.user_id = $2',
                        [teamId, socket.user.id]
                    );

                    if (res.rows.length > 0) {
                        const messageRes = await db.query(
                            'INSERT INTO squad_messages (team_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
                            [teamId, socket.user.id, content]
                        );

                        const message = {
                            ...messageRes.rows[0],
                            sender_name: res.rows[0].ff_ign
                        };

                        this.io.to(`team_${teamId}`).emit('new_message', message);
                    }
                } catch (err) {
                    console.error('Socket Send Message Error:', err);
                }
            });

            socket.on('disconnect', () => {
                console.log(`Operative Delinked: ${socket.id}`);
            });
        });
    }

    // Triggered from Controllers
    emitToMatch(matchId, update) {
        this.io.to(`match_${matchId}`).emit('live_update', update);
    }

    emitNotification(userId, notification) {
        console.log(`[Socket] Sending notification to User_${userId}`);
        this.io.to(`user_${userId}`).emit('notification', notification);
    }
}

module.exports = SocketService;
