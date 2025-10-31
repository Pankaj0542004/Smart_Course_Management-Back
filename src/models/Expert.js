const mongoose = require('mongoose');

const expertSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, index: true },
		passwordHash: { type: String, required: true },
		role: { type: String, default: 'Admin', immutable: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Expert', expertSchema);
