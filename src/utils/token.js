const jwt = require('jsonwebtoken');

function generateAccessToken(payload) {
	const secret = process.env.JWT_SECRET;
	const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '1h';
	return jwt.sign(payload, secret, { expiresIn });
}

function generateRefreshToken(payload) {
	const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
	const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
	return jwt.sign(payload, secret, { expiresIn });
}

function verifyAccessToken(token) {
	return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken };
