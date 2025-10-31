const bcrypt = require('bcryptjs');
const Expert = require('../models/Expert');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');

function normalizeEmail(email) {
	return String(email).trim().toLowerCase();
}

exports.register = async (req, res) => {
	try {
		const { name, email, password, confirmPassword } = req.body;
		if (!name || !email || !password || !confirmPassword) {
			return res.status(400).json({ message: 'Missing required fields' });
		}
		if (password !== confirmPassword) {
			return res.status(400).json({ message: 'Passwords do not match' });
		}
		const normalizedEmail = normalizeEmail(email);
		const existing = await Expert.findOne({ email: normalizedEmail });
		if (existing) {
			return res.status(409).json({ message: 'Email already registered' });
		}
		const salt = await bcrypt.genSalt(10);
		const passwordHash = await bcrypt.hash(password, salt);
		const expert = await Expert.create({
			name,
			email: normalizedEmail,
			passwordHash,
		});
		const payload = { id: expert._id.toString(), role: 'Admin', type: 'expert' };
		const accessToken = generateAccessToken(payload);
		const refreshToken = generateRefreshToken(payload);
		return res.status(201).json({
			message: 'Registered successfully',
			expert: { id: expert._id, name: expert.name, email: expert.email, role: 'Expert' },
			tokens: { accessToken, refreshToken },
		});
	} catch (err) {
		return res.status(500).json({ message: 'Server error', error: err.message });
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required' });
		}
		const normalizedEmail = normalizeEmail(email);
		const expert = await Expert.findOne({ email: normalizedEmail });
		if (!expert) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}
		const valid = await bcrypt.compare(password, expert.passwordHash);
		if (!valid) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}
		const payload = { id: expert._id.toString(), role: 'Admin', type: 'expert' };
		const accessToken = generateAccessToken(payload);
		const refreshToken = generateRefreshToken(payload);
		return res.json({
			message: 'Logged in successfully',
			expert: { id: expert._id, name: expert.name, email: expert.email, role: 'Expert' },
			tokens: { accessToken, refreshToken },
		});
	} catch (err) {
		return res.status(500).json({ message: 'Server error', error: err.message });
	}
};

exports.me = async (req, res) => {
	try {
		return res.json({ user: req.user });
	} catch (err) {
		return res.status(500).json({ message: 'Server error', error: err.message });
	}
};
