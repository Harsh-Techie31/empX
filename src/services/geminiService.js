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
  "sentiment": (a number between -1.0 (very negative) and 1.0 (very positive)),
  "priority": "Low" | "Medium" | "High" | "Critical",
  "summary": (a 1-sentence summary of the email)
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
            sentiment: 0,
            priority: 'Low',
            summary: 'Failed to analyze email content due to API error.',
        };
    }
};

module.exports = {
    analyzeEmail,
};
