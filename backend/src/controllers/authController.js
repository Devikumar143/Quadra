const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateTokens = async (userId, role) => {
    const accessToken = jwt.sign(
        { id: userId, role: role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, refreshToken, expiresAt]
    );

    return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
    const { full_name, university_id, ff_uid, ff_ign, email, password } = req.body;

    try {
        const userExists = await db.query(
            'SELECT * FROM users WHERE university_id = $1 OR ff_uid = $2 OR email = $3',
            [university_id, ff_uid, email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            'INSERT INTO users (full_name, university_id, ff_uid, ff_ign, email, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, role',
            [full_name, university_id, ff_uid, ff_ign, email, password_hash]
        );

        const { accessToken, refreshToken } = await generateTokens(newUser.rows[0].id, newUser.rows[0].role);

        res.status(201).json({ token: accessToken, refreshToken, user: newUser.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0 || !(await bcrypt.compare(password, user.rows[0].password_hash))) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const { accessToken, refreshToken } = await generateTokens(user.rows[0].id, user.rows[0].role);

        res.json({
            token: accessToken,
            refreshToken,
            user: {
                id: user.rows[0].id,
                full_name: user.rows[0].full_name,
                ff_ign: user.rows[0].ff_ign,
                role: user.rows[0].role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

exports.refresh = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required.' });

    try {
        const result = await db.query(`
            SELECT rt.*, u.role 
            FROM refresh_tokens rt 
            JOIN users u ON rt.user_id = u.id 
            WHERE rt.token = $1 AND rt.expires_at > NOW()
        `, [refreshToken]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid or expired refresh token.' });
        }

        const { user_id, role } = result.rows[0];

        // Delete old token and issue new pair (Token Rotation)
        await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
        const tokens = await generateTokens(user_id, role);

        res.json({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during token refresh.' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await db.query(`
            SELECT u.*, t.name as team_name
            FROM users u
            LEFT JOIN team_members tm ON u.id = tm.user_id
            LEFT JOIN teams t ON tm.team_id = t.id
            WHERE u.id = $1
        `, [req.user.id]);

        if (user.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
};
