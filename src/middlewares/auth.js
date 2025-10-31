const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
	const authHeader = req.headers.authorization || '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
	if (!token) {
		return res.status(401).json({ message: 'Authentication token missing' });
	}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded; // { id, role, type }
		return next();
	} catch (err) {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
}

function authorize(allowedRoles = []) {
	return (req, res, next) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (allowedRoles.length === 0) return next();
		if (allowedRoles.includes(req.user.role)) return next();
		return res.status(403).json({ message: 'Forbidden' });
	};
}

module.exports = { authenticate, authorize };
