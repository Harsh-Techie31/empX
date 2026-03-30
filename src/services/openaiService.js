const openai = require('../config/openai');

/**
 * Calls OpenAI to classify the email content, extract sentiment, priority, and summary.
 * 
 * @param {string} subject - Email subject
 * @param {string} body - Email body parsed
 * @returns {Promise<Object>} The parsed JSON from OpenAI
 */
const analyzeEmail = async (subject, body) => {
    const prompt = `
You are an AI assistant processing customer service or internal emails for a company.
Analyze the following email.

Subject: ${subject}
Body: ${body}

Output your response strictly as a JSON object matching this schema:
{
  "category": "Bug" | "Complaint" | "Feature Request" | "Spam" | "Other",
  "sentiment": (a number between -1.0 (very negative) and 1.0 (very positive)),
  "priority": "Low" | "Medium" | "High" | "Critical",
  "summary": (a 1-sentence summary of the email)
}
    `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // Or 'gpt-4o' depending on API access
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1, // Less creative, more deterministic
        });

        const resultText = response.choices[0].message.content;
        return JSON.parse(resultText);
    } catch (error) {
        console.error(`[OpenAI Service] Error analyzing email: ${error.message}`);
        // Fallback safely if API fails
        return {
            category: 'Other',
            sentiment: 0,
            priority: 'Low',
            summary: 'Failed to analyze email content.',
        };
    }
};

module.exports = {
    analyzeEmail,
};
