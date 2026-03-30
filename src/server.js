require('dotenv').config();
const express = require('express');

// Configuration
const connectDB = require('./config/db');

// Agents & Workers
const { startAgent } = require('./agents/inboxAgent');
const { initWorker } = require('./workers/emailWorker');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Basic health check route
app.get('/ping', (req, res) => {
    res.json({ status: 'ok', service: 'inbox-agent' });
});

// Initialization
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start Express server (optional, mainly for health checks right now)
        app.listen(PORT, () => {
            console.log(`[Server] Express listening on port ${PORT}`);
        });

        // Start Email Queue Worker
        initWorker();
        console.log(`[Server] Background Worker Initialized.`);

        // Start Inbox Agent (polling every 30-60 secs)
        const pollInterval = process.env.POLL_INTERVAL ? parseInt(process.env.POLL_INTERVAL) : 30000;
        startAgent(pollInterval);
        console.log(`[Server] Inbox Agent Initialized with ${pollInterval}ms internal polling.`);

    } catch (error) {
        console.error(`[Server] Initialization Error: ${error.message}`);
        process.exit(1);
    }
};

startServer();
