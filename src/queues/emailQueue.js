const { generateReply } = require('../services/geminiService');
const { sendEmail } = require('../services/emailSender');
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
        
        // const response = await fetch("https://harsh9983412.app.n8n.cloud/webhook-test/process-email", {
        const response = await fetch("https://testdiv101.app.n8n.cloud/webhook/process-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(jobData)
        });

        if (!response.ok) {
            throw new Error(`Webhook responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log(`[Queue/Webhook] Successfully received result for email: ${jobData.emailId}`);

        // 1. Generate AI Reply
        const replyBody = await generateReply(
            { subject: jobData.originalSubject, body: jobData.originalBody, sender: jobData.senderEmail },
            result
        );

        // 2. Send the Reply (Threaded)
        await sendEmail({
            to: jobData.senderEmail,
            subject: `Re: ${jobData.originalSubject}`,
            text: replyBody,
            inReplyTo: jobData.originalMessageId,
            references: [jobData.originalMessageId]
        });

        console.log(`[Queue/Webhook] Successfully sent automated reply to: ${jobData.senderEmail}`);
    } catch (error) {
        console.error(`[Queue/Webhook] Error sending to webhook: ${error.message}`);
    }
};

module.exports = {
    // emailQueue, // Commented out to avoid errors in other files if they try to access it
    pushEmailJob,
};
