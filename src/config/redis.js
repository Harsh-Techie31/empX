const IORedis = require('ioredis');

// Ensure that a REDIS_URL is strictly provided per Upstash requirements
if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is missing in environment variables. Upstash Redis URL is required.');
}

// Create a single IORedis instance using the URL.
// The `maxRetriesPerRequest: null` configuration is crucial for BullMQ integration.
const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

module.exports = connection;
