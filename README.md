# Inbox Agent Backend Service (Phase 1 MVP)

This is an AI-powered email processing pipeline built using Node.js, Express, MongoDB, Redis, BullMQ, and OpenAI.

## Prerequisites
- **Node.js**: v18+ recommended.
- **MongoDB**: A running MongoDB instance (local or Atlas).
- **Redis**: A running Redis server for the BullMQ queue system.
- **OpenAI API Key**: Required for email classification.
- **Gmail Account / App Passwords**: Since we use IMAP, generate an App Password in your Google Account for basic Auth or use another compatible email provider.

## Setup Instructions

1. **Clone the repository/Navigate to directory**
2. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`
3. **Environment Setup**:
   Create a \`.env\` file in the root based on \`.env.example\`:
   \`\`\`env
   MONGODB_URI=mongodb://localhost:27017/inbox-agent
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   OPENAI_API_KEY=sk-your-key-here
   IMAP_HOST=imap.gmail.com
   IMAP_PORT=993
   IMAP_USER=your-email@gmail.com
   IMAP_PASS=your-16-char-app-password
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
