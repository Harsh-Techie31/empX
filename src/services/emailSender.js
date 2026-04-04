const nodemailer = require('nodemailer');

/**
 * Sends an email using SMTP (Gmail).
 * Supports threading via In-Reply-To and References headers.
 * 
 * @param {Object} options - { to, subject, text, inReplyTo, references }
 */
const sendEmail = async ({ to, subject, text, inReplyTo, references }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.IMAP_USER,
                pass: process.env.IMAP_PASS, // Using same app password
            },
        });

        const mailOptions = {
            from: process.env.IMAP_USER,
            to,
            subject,
            text,
            // Threading headers
            headers: {
                'In-Reply-To': inReplyTo,
                'References': Array.isArray(references) ? references.join(' ') : references,
            },
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Sender] Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[Email Sender] Error sending email: ${error.message}`);
        throw error;
    }
};

module.exports = {
    sendEmail,
};
