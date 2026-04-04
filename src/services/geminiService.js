/**
 * Calls Gemini REST API to classify the email content, extract sentiment, priority, and summary.
 * 
 * @param {string} subject - Email subject
 * @param {string} body - Email body parsed
 * @returns {Promise<Object>} The parsed JSON from Gemini
 */
const analyzeEmail = async (subject, body) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[Gemini Service] GEMINI_API_KEY is not set');
        return { category: 'Other', sentiment: 0, priority: 'Low', summary: 'Missing API Key.' };
    }

    const promptText = `
You are an AI assistant processing customer service or internal emails for a company.
Analyze the following email.

Subject: ${subject}
Body: ${body}

Output your response strictly as a JSON object matching this schema without any markdown formatting wrappers (like \`\`\`json):
{
  "category": "Bug" | "Complaint" | "Feature Request" | "Spam" | "Other",
  "domain": "AI & Machine Learning" | "Cybersecurity" | "Backend Developer" | "Frontend Developer" | "DevOps" | "Cloud",
  "sentiment": (a number between 0 (very negative) and 1.0 (very positive)),
  "priority": "Low" | "Medium" | "High" | "Critical",
  "summary": (a 2-3 sentence summary of the email)
}
    `;

    try {
        // Hitting the latest gemini-3-flash-preview model via REST payload
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        // Ensure any stray newlines or markdown wrappers aren't breaking JSON parser (responseMimeType usually handles this though)
        const cleanText = resultText.replace(/^```json/m, '').replace(/```$/m, '').trim();
        return JSON.parse(cleanText);

    } catch (error) {
        console.error(`[Gemini Service] Error analyzing email: ${error.message}`);
        return {
            category: 'Other',
            domain: 'Other',
            sentiment: 0,
            priority: 'Low',
            summary: 'Failed to analyze email content due to API error.',
        };
    }
};

/**
 * Generates a professional email reply based on the processing result.
 * 
 * @param {Object} originalEmail - { subject, body, sender }
 * @param {Object} result - The processed result from n8n (duplicate or assignment)
 * @returns {Promise<string>} The AI generated email body
 */
const generateReply = async (originalEmail, result) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[Gemini Service] GEMINI_API_KEY is not set');
        return "Thank you for your email. We're currently processing your request.";
    }

    let resultContext = '';
    if (result.output) {
        // Case: Duplicate issue
        resultContext = `A similar issue has already been raised and is being tracked here: ${result.output}`;
    } else if (Array.isArray(result) && result.length > 0) {
        // Case: New assignment
        const task = result[0];
        resultContext = `We've created a new task for your request (ID: ${task.issueId}). The task titled "${task.taskTitle}" has been assigned. Logic: ${task.latestAiReasoning}`;
    } else {
        resultContext = "Your request has been successfully processed and added to our tracking system.";
    }

    const promptText = `
You are a professional customer support representative. 
Craft a polite, helpful, and concise email reply to the following customer inquiry.

Original Subject: ${originalEmail.subject}
Original Body: ${originalEmail.body}

Processing Result to communicate:
${resultContext}

Guidelines:
- Start with a warm greeting.
- Acknowledge their issue clearly.
- Provide the processing details naturally.
- Ensure the tone is helpful and empathetic.
- End with a professional sign-off (e.g. "Best regards, The Team").
- Return only the email body text, no headers or redundant fields.
    `;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }],
                generationConfig: {
                    temperature: 0.7,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Your request is being handled by our team.";

    } catch (error) {
        console.error(`[Gemini Service] Error generating reply: ${error.message}`);
        return "Thank you for your email. We've received your request and will get back to you shortly.";
    }
};

module.exports = {
    analyzeEmail,
    generateReply,
};
