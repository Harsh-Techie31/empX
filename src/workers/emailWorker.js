const { Worker } = require('bullmq');
const redisOptions = require('../config/redis');

// Initialize the worker for the emailQueue
const initWorker = () => {
    const worker = new Worker('emailQueue', async (job) => {
        // Just log the job payload for Phase 1 MVP
        console.log('\n[Worker] ---------------------------------------------');
        console.log(`[Worker] Started processing job: ${job.id}`);
        console.log(`[Worker] Job Data payload:`);
        console.log(JSON.stringify(job.data, null, 2));
        console.log('[Worker] ---------------------------------------------\n');
        
        // In the future: handle complex sub-workflows (e.g. creating Jira tickets, sending auto-responses, etc.)
    }, {
        connection: redisOptions,
        concurrency: 5, // Process up to 5 jobs concurrently
    });

    worker.on('completed', (job) => {
        console.log(`[Worker] Job ${job.id} has completed successfully!`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job.id} has failed with error: ${err.message}`);
    });

    return worker;
};

module.exports = {
    initWorker,
};
