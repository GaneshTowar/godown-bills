import jwt from 'jsonwebtoken';

function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
}

export function signAdminToken(payload) {
    return jwt.sign({ ...payload, role: 'admin' }, getSecret(), { expiresIn: '30d' });
}

export function signPartyToken(payload) {
    return jwt.sign({ ...payload, role: 'party' }, getSecret(), { expiresIn: '30d' });
}

function verifyToken(token, expectedRole) {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, getSecret());
        if (decoded.role !== expectedRole) return null;
        return decoded;
    } catch {
        return null;
    }
}

export function verifyAdmin(req) {
    return verifyToken(req.cookies.auth_token, 'admin');
}

export function verifyParty(req) {
    return verifyToken(req.cookies.party_token, 'party');
}

export function requireAdmin(req, res) {
    const decoded = verifyAdmin(req);
    if (!decoded) {
        res.status(401).json({ success: false, error: 'Admin authentication required.' });
        return null;
    }
    return decoded;
}

export function requireParty(req, res) {
    const decoded = verifyParty(req);
    if (!decoded) {
        res.status(401).json({ success: false, error: 'Party authentication required.' });
        return null;
    }
    return decoded;
}
