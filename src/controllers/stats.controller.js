const User = require('../models/User');

exports.users = async (req, res) => {
	try {
		const [totalUsers, totalStudents] = await Promise.all([
			User.countDocuments({}),
			User.countDocuments({ role: 'Student' }),
		]);
		return res.json({ totalUsers, totalStudents });
	} catch (err) {
		return res.status(500).json({ message: 'Server error', error: err.message });
	}
};


