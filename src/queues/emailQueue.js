const { Queue } = require('bullmq');
const connection = require('../config/redis');

// Initialize the queue safely using the shared ioredis instance
const emailQueue = new Queue('emailQueue', {
    connection,
});

/**
 * Helper to push an email job to the queue
 * @param {Object} jobData - { emailId, category, priority, summary }
 */
const pushEmailJob = async (jobData) => {
    try {
        await emailQueue.add('processEmail', jobData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
        console.log(`[Queue] Pushed job for email: ${jobData.emailId}`);
    } catch (error) {
        console.error(`[Queue] Error pushing job: ${error.message}`);
    }
};

module.exports = {
    emailQueue,
    pushEmailJob,
};
