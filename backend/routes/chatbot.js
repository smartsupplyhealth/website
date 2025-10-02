// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { auth } = require('../middleware/auth');

// POST /api/chatbot - Send a new message
router.post('/', auth, chatbotController.handleChat);

// POST /api/chatbot/message - Alternative endpoint for sending messages
router.post('/message', auth, chatbotController.handleChat);

// GET /api/chatbot/history - Retrieve user's conversation history
router.get('/history', auth, chatbotController.getChatHistory);

module.exports = router;
