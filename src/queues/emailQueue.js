// const { Queue } = require('bullmq');
// const connection = require('../config/redis');

// // Initialize the queue safely using the shared ioredis instance
// const emailQueue = new Queue('emailQueue', {
//     connection,
// });

/**
 * Helper to push an email job to the n8n webhook
 * @param {Object} jobData - { emailId, category, priority, summary }
 */
const pushEmailJob = async (jobData) => {
    try {
        console.log(`[Queue/Webhook] Sending data to n8n for email: ${jobData.emailId}`);
        
        const response = await fetch("https://harsh9983412.app.n8n.cloud/webhook-test/process-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(jobData)
        });

        if (!response.ok) {
            throw new Error(`Webhook responded with status: ${response.status}`);
        }

        console.log(`[Queue/Webhook] Successfully posted job for email: ${jobData.emailId}`);
    } catch (error) {
        console.error(`[Queue/Webhook] Error sending to webhook: ${error.message}`);
    }
};

module.exports = {
    // emailQueue, // Commented out to avoid errors in other files if they try to access it
    pushEmailJob,
};
