const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectToDatabase } = require('./src/config/db');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
// Robust CORS: allow a whitelist of origins (comma/space separated) and support credentials
// Example: CLIENT_ORIGIN="http://localhost:5173, https://your-frontend.vercel.app"
const rawOrigins = process.env.CLIENT_ORIGIN || '';
const allowList = rawOrigins
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

// In development, also allow common localhost origins by default if no explicit allowList is provided
const devDefaults = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser requests (no origin) and health checks
        if (!origin) return callback(null, true);
        // permissive if not configured
        if (allowList.length === 0) {
            // If dev, also allow common Vite dev origins
            if (process.env.NODE_ENV !== 'production') {
                if (devDefaults.includes(origin)) return callback(null, true);
            }
            return callback(null, true);
        }
        if (allowList.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    // Be explicit to avoid proxy/load balancer quirks
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
// Ensure preflight requests are handled for all routes
app.options('*', cors(corsOptions));
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
