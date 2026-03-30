# Inbox Agent Backend Service (Phase 1 MVP)

This is an AI-powered email processing pipeline built using Node.js, Express, MongoDB, Redis, BullMQ, and OpenAI.

## Prerequisites
- **Node.js**: v18+ recommended.
- **MongoDB**: A running MongoDB Atlas cluster (requires `mongodb+srv://` URI).
- **Redis (Upstash)**: A cloud Redis instance using a `rediss://` URL.
- **Gemini API Key**: Required for fast AI classification via REST.
- **Gmail Account / App Passwords**: Since we use IMAP, generate an App Password in your Google Account.

## Setup Instructions

1. **Clone the repository/Navigate to directory**
2. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`
3. **Environment Setup**:
   Create a \`.env\` file in the root based on \`.env.example\`:
   \`\`\`env
   MONGODB_URI="mongodb+srv://..."
   REDIS_URL="rediss://default:********@popular-gannet-72063.upstash.io:6379"
   GEMINI_API_KEY="AIzaSy..."
   IMAP_HOST="imap.gmail.com"
   IMAP_PORT=993
   IMAP_USER="your-email@gmail.com"
   IMAP_PASS="your-16-char-app-password"
   POLL_INTERVAL=30000 
   PORT=3000
   \`\`\`

## Running the Application

To run the full agent pipeline (API server, Background Agent, and Queue Worker):
\`\`\`bash
node src/server.js
\`\`\`

## Folder Structure
- \`src/config/\`: Database (MongoDB), Redis, and OpenAI configurations.
- \`src/models/\`: Mongoose data schemas.
- \`src/services/\`: Email fetching (ImapFlow) and AI classification (OpenAI) services.
- \`src/queues/\`: BullMQ queue initializer and push helper.
- \`src/workers/\`: BullMQ consumers that process queued email jobs.
- \`src/utils/\`: Priority resolver and hybrid logic scripts.
- \`src/agents/\`: The main polling inbox agent script orchestrating the logic flow.

## Testing manually
Send an email to the configured \`IMAP_USER\` email address. Keep an eye on the console logs of \`node src/server.js\` to observe:
1. Agent identifying finding the unread email.
2. The AI prompt output.
3. Priority resolving.
4. Saving to the DB.
5. Pushing to the queue.
6. Worker pulling the job from the queue and logging it.
