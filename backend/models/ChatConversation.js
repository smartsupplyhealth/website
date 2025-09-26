// backend/models/ChatConversation.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model'], // 'user' for user's message, 'model' for chatbot's reply
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    // REMOVED: unique: true <- This was the cause of the error
  },
  messages: [messageSchema],
}, { timestamps: true });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
