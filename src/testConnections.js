require('dotenv').config();
const mongoose = require('mongoose');
const IORedis = require('ioredis');
const { ImapFlow } = require('imapflow');

async function testMongoDB() {
    process.stdout.write('Testing MongoDB (Atlas)... ');
    try {
        if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing");
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connected');
        await mongoose.disconnect();
    } catch (err) {
        console.log(`❌ Failed. Error: ${err.message}`);
    }
}

async function testRedis() {
    process.stdout.write('Testing Redis (Upstash)... ');
    try {
        if (!process.env.REDIS_URL) throw new Error("REDIS_URL is missing");
        const redis = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null, connectTimeout: 5000 });
        
        await new Promise((resolve, reject) => {
            redis.on('ready', () => { resolve(); });
            redis.on('error', (err) => { reject(err); });
        });
        
        console.log('✅ Connected');
        await redis.quit();
    } catch (err) {
        console.log(`❌ Failed. Error: ${err.message}`);
    }
}

async function testIMAP() {
    process.stdout.write('Testing IMAP (Gmail)... ');
    try {
        if (!process.env.IMAP_USER || !process.env.IMAP_PASS) throw new Error("IMAP_USER or IMAP_PASS is missing");
        
        const client = new ImapFlow({
            host: process.env.IMAP_HOST || 'imap.gmail.com',
            port: parseInt(process.env.IMAP_PORT || '993', 10),
            secure: true,
            auth: {
                user: process.env.IMAP_USER,
                pass: process.env.IMAP_PASS, 
            },
            logger: false,
            // Lower timeout for faster failing
            connectionTimeout: 5000
        });

        await client.connect();
        console.log('✅ Connected');
        await client.logout();
    } catch (err) {
        console.log(`❌ Failed. Error: ${err.message}`);
    }
}

async function testGemini() {
    process.stdout.write('Testing Gemini API... ');
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello! Just reply with 'ok' and nothing else strictly." }] }],
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`HTTP ${response.status} - ${errBody}`);
        }
        
        const data = await response.json();
        if (data && data.candidates) {
            console.log('✅ Connected & Responded');
        } else {
             throw new Error("Invalid response format from Gemini");
        }
    } catch (err) {
         console.log(`❌ Failed. Error: ${err.message}`);
    }
}

async function runTests() {
    console.log("========================================");
    console.log("   Running Connection Health Checks");
    console.log("========================================\n");
    
    await testMongoDB();
    await testRedis();
    await testIMAP();
    await testGemini();
    
    console.log("\n========================================");
    console.log("   Finished.");
    console.log("========================================\n");
    process.exit(0);
}

runTests();
