/**
 * Determines final priority based on AI output and sentiment.
 * 
 * @param {string} aiPriority - Low, Medium, High, Critical
 * @param {number} sentiment - -1.0 to 1.0
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {string} Final Priority: Low, Medium, High, Critical
 */
const resolvePriority = (aiPriority, sentiment, subject = '', body = '') => {
    let finalPriority = aiPriority;

    const content = `${subject} ${body}`.toLowerCase();

    // Critical keywords override
    const criticalKeywords = ['down', 'outage', 'broken', 'urgent', 'asap', 'crash', 'not working', 'failed'];
    const hasCriticalKeyword = criticalKeywords.some((kw) => content.includes(kw));

    if (hasCriticalKeyword) {
        return 'Critical';
    }

    // High sentiment override: Very negative -> High
    if (sentiment < -0.7 && finalPriority !== 'Critical') {
        return 'High';
    }

    // Adjusting based on sentiment heuristics
    if (finalPriority === 'Low' && sentiment < -0.3) {
        finalPriority = 'Medium';
    }

    // Fallback normalization just in case
    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (!validPriorities.includes(finalPriority)) {
        finalPriority = 'Low'; // Default lowest safety if AI outputs gibberish
    }

    return finalPriority;
};

module.exports = {
    resolvePriority,
};
