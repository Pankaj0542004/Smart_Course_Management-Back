const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');

function normalizeEmail(email) {
	return String(email).trim().toLowerCase();
}

exports.register = async (req, res) => {
	try {
		const { name, email, password, confirmPassword, role } = req.body;
		if (!name || !email || !password || !confirmPassword) {
			return res.status(400).json({ message: 'Missing required fields' });
		}
		if (password !== confirmPassword) {
			return res.status(400).json({ message: 'Passwords do not match' });
		}
		const normalizedEmail = normalizeEmail(email);
		const existing = await User.findOne({ email: normalizedEmail });
		if (existing) {
			return res.status(409).json({ message: 'Email already registered' });
		}
		const salt = await bcrypt.genSalt(10);
		const passwordHash = await bcrypt.hash(password, salt);
		const user = await User.create({
			name,
			email: normalizedEmail,
			passwordHash,
			role: role === 'Admin' ? 'Admin' : 'Student',
		});
		const payload = { id: user._id.toString(), role: user.role, type: 'user' };
		const accessToken = generateAccessToken(payload);
		const refreshToken = generateRefreshToken(payload);
		return res.status(201).json({
			message: 'Registered successfully',
			user: { id: user._id, name: user.name, email: user.email, role: user.role },
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
		const user = await User.findOne({ email: normalizedEmail });
		if (!user) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}
		const valid = await bcrypt.compare(password, user.passwordHash);
		if (!valid) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}
		const payload = { id: user._id.toString(), role: user.role, type: 'user' };
		const accessToken = generateAccessToken(payload);
		const refreshToken = generateRefreshToken(payload);
		return res.json({
			message: 'Logged in successfully',
			user: { id: user._id, name: user.name, email: user.email, role: user.role },
			tokens: { accessToken, refreshToken },
		});
	} catch (err) {
		return res.status(500).json({ message: 'Server error', error: err.message });
	}
};

exports.me = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ message: 'Unauthorized' });
		const user = await User.findById(userId).select('_id name email role createdAt updatedAt');
		if (!user) return res.status(404).json({ message: 'User not found' });
		return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt } });
	} catch (err) {
		return res.status(500).json({ message: 'Server error', error: err.message });
	}
};

exports.updateMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const { name, email, password, confirmPassword } = req.body || {};

        const updates = {};
        if (name != null) updates.name = String(name);
        if (email != null) updates.email = String(email).trim().toLowerCase();

        if (password != null || confirmPassword != null) {
            if (!password || password !== confirmPassword) {
                return res.status(400).json({ message: 'Passwords do not match' });
            }
            const salt = await bcrypt.genSalt(10);
            updates.passwordHash = await bcrypt.hash(password, salt);
        }

        if (updates.email) {
            const exists = await User.findOne({ _id: { $ne: userId }, email: updates.email });
            if (exists) return res.status(409).json({ message: 'Email already in use' });
        }

        const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('_id name email role createdAt updatedAt');
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.json({ message: 'Profile updated', user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt } });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};