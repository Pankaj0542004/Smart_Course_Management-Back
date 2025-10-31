const mongoose = require('mongoose');

async function connectToDatabase(mongoUri) {
	if (!mongoUri) {
		throw new Error('MONGODB_URI is not defined');
	}
	mongoose.set('strictQuery', true);
	await mongoose.connect(mongoUri);
	return mongoose.connection;
}

module.exports = { connectToDatabase };
