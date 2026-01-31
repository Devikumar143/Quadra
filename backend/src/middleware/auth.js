const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        console.log('[Auth] No token provided');
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.log('[Auth] Token verification failed:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.', code: 'TOKEN_EXPIRED' });
        }
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied. Clearance required: ${roles.join(' or ')}` });
        }

        next();
    };
};

module.exports = { verifyToken, authorize };
