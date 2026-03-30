const { ImapFlow } = require('imapflow');
const simpleParser = require('mailparser').simpleParser;

/**
 * Initializes and returns the ImapFlow client connection
 * @returns {Promise<ImapFlow>}
 */
const getImapClient = async () => {
    const client = new ImapFlow({
        host: process.env.IMAP_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP_PORT || '993', 10),
        secure: true,
        auth: {
            user: process.env.IMAP_USER,
            pass: process.env.IMAP_PASS, // App password recommended
        },
        logger: false, // Set to true for debugging
    });

    await client.connect();
    return client;
};

/**
 * Fetches unread emails from INBOX and returns array of parsed details.
 * Also flags the fetched messages so we don't fetch them again if we don't want to.
 * We can modify this logic depending on exact requirements (e.g., mark \Seen).
 * 
 * @returns {Promise<Array<Object>>}
 */
const fetchUnreadEmails = async () => {
    let client;
    const emails = [];

    try {
        client = await getImapClient();
        
        // Select and lock the INBOX
        const lock = await client.getbox('INBOX');
        
        // Find unread messages
        // 'seen: false' filters to only UNSEEN emails
        // Search yields an asymptotic Sequence (by UIDs best practice)
        for await (const message of client.fetch({ seen: false }, { envelope: true, source: true, uid: true })) {
            const parsed = await simpleParser(message.source);
            
            emails.push({
                messageId: parsed.messageId || `uid-${message.uid}-${Date.now()}`,
                subject: parsed.subject,
                sender: parsed.from?.text || '',
                body: parsed.text || parsed.html || '', 
                uid: message.uid, // Required for marking as read later
            });
        }
    } catch (error) {
        console.error(`[Email Fetcher] Error fetching emails: ${error.message}`);
    } finally {
        if (client) {
            await client.logout();
        }
    }

    return emails;
};

/**
 * Marks specific email UIDs as seen (read).
 * 
 * @param {Array<number>} uids - Array of message UIDs
 */
const markEmailsAsSeen = async (uids) => {
    if (!uids || uids.length === 0) return;

    let client;
    try {
        client = await getImapClient();
        await client.getbox('INBOX');

        // Note: Using uid sequence
        await client.messageFlagsAdd(uids, ['\\Seen'], { uid: true });
        console.log(`[Email Fetcher] Marked UIDs ${uids.join(', ')} as \\Seen.`);
    } catch (error) {
        console.error(`[Email Fetcher] Error marking messages as seen: ${error.message}`);
    } finally {
        if (client) {
            await client.logout();
        }
    }
};

module.exports = {
    fetchUnreadEmails,
    markEmailsAsSeen,
};
