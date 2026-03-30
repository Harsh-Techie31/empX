const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true,
        unique: true, // Prevents processing same email twice
    },
    subject: {
        type: String,
        default: '(No Subject)',
    },
    body: {
        type: String,
        default: '',
    },
    sender: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['Bug', 'Complaint', 'Feature Request', 'Spam', 'Other', 'Pending'],
        default: 'Pending',
    },
    sentiment: {
        type: Number,
        min: -1,
        max: 1,
        default: 0,
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Low',
    },
    summary: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'processed'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
