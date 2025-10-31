const mongoose = require('mongoose');
const Course = require('../models/Course');

function ok(res, message, data = null) {
	return res.status(200).json({ success: true, message, data });
}

function created(res, message, data = null) {
	return res.status(201).json({ success: true, message, data });
}

function error(res, status, message) {
	return res.status(status).json({ success: false, message, data: null });
}

function isValidObjectId(id) {
	return mongoose.Types.ObjectId.isValid(id);
}

// POST /api/courses
exports.createCourse = async (req, res) => {
	try {
		const {
			course_name,
			course_code,
			course_duration,
			description,
			instructor_name,
			thumbnail_url,
			video_url,
			is_published,
			students,
		} = req.body || {};

		if (!course_name || !course_code || course_duration == null) {
			return error(res, 400, 'course_name, course_code and course_duration are required');
		}

		if (typeof course_name !== 'string' || course_name.trim().length < 3 || course_name.trim().length > 255) {
			return error(res, 400, 'course_name must be a string between 3 and 255 chars');
		}

		if (typeof course_code !== 'string' || !/^[A-Z0-9]{4,10}$/.test(course_code.toUpperCase())) {
			return error(res, 400, 'course_code must match /^[A-Z0-9]{4,10}$/');
		}

		if (typeof course_duration !== 'number' || course_duration < 1 || course_duration > 104) {
			return error(res, 400, 'course_duration must be a number between 1 and 104');
		}

		// Ensure uniqueness for course_code (case-insensitive by uppercasing)
		const existing = await Course.findOne({ course_code: course_code.toUpperCase() });
		if (existing) {
			return error(res, 409, 'A course with this course_code already exists');
		}

		const course = await Course.create({
			course_name: course_name.trim(),
			course_code: course_code.toUpperCase(),
			course_duration,
			description: typeof description === 'string' ? description : '',
			instructor_name: typeof instructor_name === 'string' ? instructor_name : '',
			thumbnail_url: typeof thumbnail_url === 'string' ? thumbnail_url : '',
			video_url: typeof video_url === 'string' ? video_url : '',
			is_published: typeof is_published === 'boolean' ? is_published : true,
			students: Array.isArray(students) ? students : [],
		});

		return created(res, 'Course created successfully', course);
	} catch (err) {
		return error(res, 500, err.message || 'Failed to create course');
	}
};

// GET /api/courses
exports.getAllCourses = async (req, res) => {
	try {
        const query = {};
        const courses = await Course.find(query).sort({ createdAt: -1 });
		return ok(res, 'Courses fetched successfully', { count: courses.length, courses });
	} catch (err) {
		return error(res, 500, err.message || 'Failed to fetch courses');
	}
};

// GET /api/courses/active
exports.getActiveCourses = async (req, res) => {
    try {
        const courses = await Course.find({
            $or: [
                { is_published: true },
                { is_published: { $exists: false } },
            ],
        }).sort({ createdAt: -1 });
        return ok(res, 'Active courses fetched successfully', { count: courses.length, courses });
    } catch (err) {
        return error(res, 500, err.message || 'Failed to fetch active courses');
    }
};

// GET /api/courses/:id
exports.getCourseById = async (req, res) => {
	try {
		const { id } = req.params;
		if (!isValidObjectId(id)) {
			return error(res, 400, 'Invalid course id');
		}
		const course = await Course.findById(id);
		if (!course) {
			return error(res, 404, 'Course not found');
		}
		return ok(res, 'Course fetched successfully', course);
	} catch (err) {
		return error(res, 500, err.message || 'Failed to fetch course');
	}
};

// PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
	try {
		const { id } = req.params;
		if (!isValidObjectId(id)) {
			return error(res, 400, 'Invalid course id');
		}

		const updates = {};
		const allowed = [
			'course_name',
			'course_code',
			'course_duration',
			'description',
			'instructor_name',
			'thumbnail_url',
			'video_url',
			'is_published',
			'students',
		];

		for (const key of allowed) {
			if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
				updates[key] = req.body[key];
			}
		}

		if (updates.course_name != null) {
			if (typeof updates.course_name !== 'string' || updates.course_name.trim().length < 3 || updates.course_name.trim().length > 255) {
				return error(res, 400, 'course_name must be a string between 3 and 255 chars');
			}
			updates.course_name = updates.course_name.trim();
		}

		if (updates.course_code != null) {
			if (typeof updates.course_code !== 'string' || !/^[A-Z0-9]{4,10}$/.test(updates.course_code.toUpperCase())) {
				return error(res, 400, 'course_code must match /^[A-Z0-9]{4,10}$/');
			}
			updates.course_code = updates.course_code.toUpperCase();
			const duplicate = await Course.findOne({ course_code: updates.course_code, _id: { $ne: id } });
			if (duplicate) {
				return error(res, 409, 'A course with this course_code already exists');
			}
		}

		if (updates.course_duration != null) {
			if (typeof updates.course_duration !== 'number' || updates.course_duration < 1 || updates.course_duration > 104) {
				return error(res, 400, 'course_duration must be a number between 1 and 104');
			}
		}

		if (updates.students != null && !Array.isArray(updates.students)) {
			return error(res, 400, 'students must be an array of ObjectIds');
		}

		const updated = await Course.findByIdAndUpdate(id, updates, { new: true });
		if (!updated) {
			return error(res, 404, 'Course not found');
		}
		return ok(res, 'Course updated successfully', updated);
	} catch (err) {
		return error(res, 500, err.message || 'Failed to update course');
	}
};

// DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
	try {
		const { id } = req.params;
		if (!isValidObjectId(id)) {
			return error(res, 400, 'Invalid course id');
		}
        const course = await Course.findByIdAndDelete(id);
        if (!course) {
            return error(res, 404, 'Course not found');
        }
		return ok(res, 'Course deleted successfully', null);
	} catch (err) {
		return error(res, 500, err.message || 'Failed to delete course');
	}
};

// GET /api/courses/:id/students
exports.getCourseStudents = async (req, res) => {
	try {
		const { id } = req.params;
		if (!isValidObjectId(id)) {
			return error(res, 400, 'Invalid course id');
		}
		const course = await Course.findById(id).populate({
			path: 'students',
			select: '_id name email createdAt',
		});
		if (!course) {
			return error(res, 404, 'Course not found');
		}
		const students = (course.students || []).map((u) => ({
			id: u._id,
			full_name: u.name,
			email: u.email,
			createdAt: u.createdAt,
		}));
		return ok(res, 'Students fetched successfully', { count: students.length, students });
	} catch (err) {
		return error(res, 500, err.message || 'Failed to fetch students');
	}
};

// POST /api/courses/:id/enroll (Student only)
exports.enrollInCourse = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return error(res, 400, 'Invalid course id');
        const userId = req.user?.id;
        if (!userId || !isValidObjectId(userId)) return error(res, 401, 'Unauthorized');
        const course = await Course.findByIdAndUpdate(
            id,
            { $addToSet: { students: userId } },
            { new: true }
        );
        if (!course) return error(res, 404, 'Course not found');
        return ok(res, 'Enrolled successfully', course);
    } catch (err) {
        return error(res, 500, err.message || 'Failed to enroll');
    }
};

// GET /api/students/me/courses (Student only)
exports.getMyCourses = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId || !isValidObjectId(userId)) return error(res, 401, 'Unauthorized');
        const courses = await Course.find({ students: userId }).sort({ createdAt: -1 });
        return ok(res, 'My courses fetched successfully', { count: courses.length, courses });
    } catch (err) {
        return error(res, 500, err.message || 'Failed to fetch my courses');
    }
};


