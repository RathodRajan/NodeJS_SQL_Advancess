const express = require('express');
const cluster = require('cluster');
const { rateLimit } = require('express-rate-limit');
const cors = require('cors');
const os = require('os');
const process = require('process');

const numCPUs = os.cpus().length;
const HostName = '127.0.0.1';
const PORT = process.env.PORT || 9000;

// Uncomment and ensure these files are properly set up
// require('./DB_Connection/DB_Connection');
const RegistrationRout = require('./Routes/Registration');

const corsOptions = {
    origin: 'http://localhost:3000', // allow only this origin
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Custom rate limit exceeded message in JSON format
const rateLimitExceededResponse = {
    status: "error",
    message: " 'rateLimit'  limit Error  , over request for windows minites request ,  Too many requests, please try again later."
};

// const allowlist = ['127.0.0.1']; // Add IPs to this list to bypass the rate limiter

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    // windowMs: 100000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: rateLimitExceededResponse, // JSON response when rate limit is exceeded
    statusCode: 429,
    // skip: (req, res) => allowlist.includes(req.ip), // Skip rate limiting for allowed IPs
    // You can use an external store like Redis for distributed rate limiting
    // store: new RedisStore({ client: redisClient })
});
 
const requestQueue = [];
const MAX_QUEUE_SIZE = 100;

const processQueue = () => {
    if (requestQueue.length === 0) return;

    const { req, res, next } = requestQueue.shift();
    next();
    setTimeout(processQueue, 100); // Process the next request after a delay
};

const queueAndProcessMiddleware = (req, res, next) => {
    if (requestQueue.length >= MAX_QUEUE_SIZE) {
        return res.status(503).json({ status: 'error', message: 'requestQueue arry Limit Probleam ,  Server is busy, please try again later.' });
    }

    requestQueue.push({ req, res, next });

    if (requestQueue.length === 1) { // Start processing if the queue was empty
        processQueue();
    }
};

if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died, starting a new worker`);
        cluster.fork(); // Replace the dead worker
    });
} else {
    const app = express();

    app.use(cors(corsOptions));

    // Increase the limit for JSON bodies and URL-encoded bodies
    app.use(express.json({ limit: '4000mb' }));
    app.use(express.urlencoded({ extended: true, limit: '4000mb' }));

    // Apply rate limiter and request queue middleware
    app.use("/", limiter, queueAndProcessMiddleware, RegistrationRout);

    // Basic error handling
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ status: 'error', message: 'Something broke!' });
    });

    app.listen(PORT, HostName, () => {
        console.log(`Worker ${process.pid} listening on http://${HostName}:${PORT}`);
    });
}
