const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

exports.listStudents = async (req, res) => {
	try {
		const { page = 1, limit = 20, q } = req.query;
		const numericPage = Math.max(parseInt(page, 10) || 1, 1);
		const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
		const filter = { role: 'Student' };
		if (q) {
			filter.$or = [
				{ name: { $regex: String(q), $options: 'i' } },
				{ email: { $regex: String(q), $options: 'i' } },
			];
		}
        const [items, total] = await Promise.all([
            User.find(filter)
                .select('_id name email role createdAt updatedAt')
                .sort({ createdAt: -1 })
                .skip((numericPage - 1) * numericLimit)
                .limit(numericLimit),
            User.countDocuments(filter),
        ]);

        // Attach course info (ids and basic fields)
        const userIds = items.map(u => u._id);
        const courses = await Course.find({ students: { $in: userIds } }).select('_id course_name course_code students');
        const userIdToCourses = new Map();
        for (const c of courses) {
            for (const uid of c.students) {
                if (!userIdToCourses.has(String(uid))) userIdToCourses.set(String(uid), []);
                userIdToCourses.get(String(uid)).push({ _id: c._id, course_name: c.course_name, course_code: c.course_code });
            }
        }
        const itemsWithCourses = items.map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
            courses: userIdToCourses.get(String(u._id)) || [],
        }));

        return res.json({
            items: itemsWithCourses,
            page: numericPage,
            limit: numericLimit,
            total,
            pages: Math.ceil(total / numericLimit) || 1,
        });
	} catch (err) {
		return res.status(500).json({ message: 'Server error', error: err.message });
	}
};

exports.getStudentById = async (req, res) => {
	try {
		const { id } = req.params;
        const student = await User.findOne({ _id: id, role: 'Student' }).select('_id name email role createdAt updatedAt');
		if (!student) return res.status(404).json({ message: 'Student not found' });
        const courses = await Course.find({ students: id }).select('_id course_name course_code');
        return res.json({ student: { ...student.toObject(), courses } });
	} catch (err) {
		return res.status(500).json({ message: 'Server error', error: err.message });
	}
};

exports.createStudent = async (req, res) => {
    try {
        const { name, email, password, courses } = req.body || {};
        if (!name || !email || !password) return res.status(400).json({ message: 'name, email, password are required' });
        const normalizedEmail = String(email).trim().toLowerCase();
        const exists = await User.findOne({ email: normalizedEmail });
        if (exists) return res.status(409).json({ message: 'Email already registered' });
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const user = await User.create({ name, email: normalizedEmail, passwordHash, role: 'Student' });
        if (Array.isArray(courses) && courses.length > 0) {
            const courseIds = courses.filter(isValidObjectId);
            if (courseIds.length > 0) {
                await Course.updateMany({ _id: { $in: courseIds } }, { $addToSet: { students: user._id } });
            }
        }
        return res.status(201).json({ message: 'Student created', student: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid student id' });
        const { name, email, password, courses } = req.body || {};
        const updates = {};
        if (name != null) updates.name = name;
        if (email != null) updates.email = String(email).trim().toLowerCase();
        if (password != null) {
            const salt = await bcrypt.genSalt(10);
            updates.passwordHash = await bcrypt.hash(password, salt);
        }
        const user = await User.findOneAndUpdate({ _id: id, role: 'Student' }, updates, { new: true });
        if (!user) return res.status(404).json({ message: 'Student not found' });

        if (Array.isArray(courses)) {
            const newIds = courses.filter(isValidObjectId).map(String);
            const currentCourses = await Course.find({ students: id }).select('_id');
            const currentIds = currentCourses.map(c => String(c._id));
            const toAdd = newIds.filter(x => !currentIds.includes(x));
            const toRemove = currentIds.filter(x => !newIds.includes(x));
            if (toAdd.length) await Course.updateMany({ _id: { $in: toAdd } }, { $addToSet: { students: id } });
            if (toRemove.length) await Course.updateMany({ _id: { $in: toRemove } }, { $pull: { students: id } });
        }

        return res.json({ message: 'Student updated', student: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid student id' });
        const user = await User.findOneAndDelete({ _id: id, role: 'Student' });
        if (!user) return res.status(404).json({ message: 'Student not found' });
        await Course.updateMany({ students: id }, { $pull: { students: id } });
        return res.json({ message: 'Student deleted' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};
