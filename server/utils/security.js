const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const hashLegacyPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

const hashPassword = (password) => bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);

const comparePassword = (password, storedHash) => {
    if (!password || !storedHash) {
        return false;
    }

    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
        return bcrypt.compareSync(password, storedHash);
    }

    return storedHash === hashLegacyPassword(password);
};

const createAuthToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const verifyAuthToken = (token) => jwt.verify(token, JWT_SECRET);

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Authentication token is required.' });
    }

    try {
        req.auth = verifyAuthToken(token);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

const normalizeId = (value) => value?.toString();

const hasAccountType = (req, allowedTypes) => allowedTypes.includes(req.auth?.accountType);

const authorizeSelfParam = (paramName) => (req, res, next) => {
    if (normalizeId(req.auth?.userId) !== normalizeId(req.params[paramName])) {
        return res.status(403).json({ message: 'You are not authorized to access this resource.' });
    }

    next();
};

const authorizeWholesalerParam = (paramName) => (req, res, next) => {
    if (!hasAccountType(req, ['wholesalerAdmin', 'employee'])) {
        return res.status(403).json({ message: 'Wholesaler access is required.' });
    }

    if (normalizeId(req.auth?.userId) !== normalizeId(req.params[paramName])) {
        return res.status(403).json({ message: 'You are not authorized to access this wholesaler resource.' });
    }

    next();
};

const requireWholesalerAdmin = (req, res, next) => {
    if (req.auth?.accountType !== 'wholesalerAdmin') {
        return res.status(403).json({ message: 'Wholesaler admin access is required.' });
    }

    next();
};

const authorizeCustomerParam = (paramName) => (req, res, next) => {
    if (req.auth?.accountType !== 'customer') {
        return res.status(403).json({ message: 'Customer access is required.' });
    }

    return authorizeSelfParam(paramName)(req, res, next);
};

module.exports = {
    hashPassword,
    comparePassword,
    createAuthToken,
    verifyAuthToken,
    authenticateToken,
    authorizeSelfParam,
    authorizeCustomerParam,
    authorizeWholesalerParam,
    requireWholesalerAdmin
};
