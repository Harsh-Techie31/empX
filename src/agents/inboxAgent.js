const { fetchUnreadEmails, markEmailsAsSeen } = require('../services/emailFetcher');
const { analyzeEmail } = require('../services/openaiService');
const { resolvePriority } = require('../utils/priorityResolver');
const Email = require('../models/Email');
const { pushEmailJob } = require('../queues/emailQueue');

/**
 * Main polling function meant to be called at an interval
 */
const pollInbox = async () => {
    try {
        console.log(`[Inbox Agent] Checking for new emails...`);
        const emails = await fetchUnreadEmails();

        if (emails.length === 0) {
            console.log(`[Inbox Agent] No new unread emails found.`);
            return;
        }

        console.log(`[Inbox Agent] Found ${emails.length} new unread emails.`);
        
        const processedUids = [];

        for (const email of emails) {
            try {
                // Ignore if we somehow already processed this exact email
                const existing = await Email.findOne({ messageId: email.messageId });
                if (existing) {
                    console.log(`[Inbox Agent] Email ${email.messageId} already exists in DB. Skipping.`);
                    // We still mark it as seen so we don't keep polling it
                    processedUids.push(email.uid);
                    continue;
                }

                // 1. Analyze via OpenAI
                const aiResult = await analyzeEmail(email.subject, email.body);
                
                // 2. Resolve Hybrid Priority
                const finalPriority = resolvePriority(
                    aiResult.priority, 
                    aiResult.sentiment, 
                    email.subject, 
                    email.body
                );

                // 3. Save to MongoDB
                const newEmailDoc = await Email.create({
                    messageId: email.messageId,
                    subject: email.subject,
                    body: email.body, // or an excerpt if too large
                    sender: email.sender,
                    category: aiResult.category,
                    sentiment: aiResult.sentiment,
                    priority: finalPriority,
                    summary: aiResult.summary,
                    status: 'processed', // or 'pending' if queue handles actual business logic
                });

                console.log(`[Inbox Agent] Logged email to DB (ID: ${newEmailDoc._id}, Priority: ${finalPriority}).`);

                // 4. Push to BullMQ
                await pushEmailJob({
                    emailId: newEmailDoc._id.toString(),
                    category: newEmailDoc.category,
                    priority: newEmailDoc.priority,
                    summary: newEmailDoc.summary,
                });

                // Prepare to mark as seen
                processedUids.push(email.uid);

            } catch (err) {
                console.error(`[Inbox Agent] Failed processing an email: ${err.message}`);
                // Don't mark as seen if it failed drastically, so we retry on next loop
            }
        }

        // 5. Mark successful emails as Read in Gmail/IMAP
        if (processedUids.length > 0) {
            await markEmailsAsSeen(processedUids);
        }

    } catch (error) {
        console.error(`[Inbox Agent] Polling cycle failed: ${error.message}`);
    }
};

/**
 * Starts the polling mechanism
 * @param {number} intervalMs - Poll interval in milliseconds 
 */
const startAgent = (intervalMs = 30000) => {
    console.log(`[Inbox Agent] Starting interval loop (${intervalMs}ms)...`);
    
    // Initial run
    pollInbox();

    // Setup interval
    setInterval(pollInbox, intervalMs);
};

module.exports = {
    startAgent,
};
