const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectToDatabase } = require('./src/config/db');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
const corsOrigin = process.env.CLIENT_ORIGIN || '*';
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
const apiRouter = require('./src/routes');
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

// Server
const port = process.env.PORT || 5000;

async function start() {
	try {
		await connectToDatabase(process.env.MONGODB_URI);
        // Ensure Course indexes are correct (drop stale courseCode index if present)
        try {
            const Course = require('./src/models/Course');
            const indexes = await Course.collection.indexes().catch(() => []);
            const bad = indexes.find((ix) => ix?.name === 'courseCode_1' || (ix?.key && Object.prototype.hasOwnProperty.call(ix.key, 'courseCode')));
            if (bad?.name) {
                await Course.collection.dropIndex(bad.name).catch(() => {});
            }
            await Course.syncIndexes();
            console.log('Course indexes reconciled');
        } catch (e) {
            console.warn('Course index reconciliation skipped:', e?.message);
        }
		app.listen(port, () => {
			console.log(`Server running on port ${port}`);
		});
	} catch (err) {
		console.error('Failed to start server:', err.message);
		process.exit(1);
	}
}

start();
