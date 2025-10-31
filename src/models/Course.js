const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
	{
		course_name: {
			type: String,
			required: true,
			trim: true,
			minlength: 3,
			maxlength: 255,
		},
		course_code: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			match: [/^[A-Z0-9]{4,10}$/, 'Course code must be 4-10 uppercase alphanumeric characters'],
			index: true,
		},
		course_duration: {
			type: Number,
			required: true,
			min: 1,
			max: 104,
		},
		description: { type: String, default: '' },
		instructor_name: { type: String, default: '' },
		thumbnail_url: { type: String, default: '' },
		video_url: { type: String, default: '' },
		is_published: { type: Boolean, default: true },
		students: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);


