// backend/controllers/chatbotController.js
const chatbotService = require('../services/chatbotService');
const ChatConversation = require('../models/ChatConversation');

// @desc    Handle a new chat message and save the conversation
// @route   POST /api/chatbot
// @access  Private
exports.handleChat = async (req, res) => {
  const { message } = req.body;
  const userId = req.user._id; // <- Use standard _id for reliability

  if (!message) {
    return res.status(400).json({ error: 'Le message est requis.' });
  }

  try {
    const reply = await chatbotService.getChatbotResponse(message);

    await ChatConversation.findOneAndUpdate(
      { userId },
      {
        $push: {
          messages: [
            { role: 'user', content: message },
            { role: 'model', content: reply },
          ],
        },
      },
      { upsert: true, new: true }
    );

    res.json({ reply });

  } catch (error) {
    console.error('Chat handling error:', error);
    res.status(500).json({ error: 'Erreur serveur lors du traitement du message.' });
  }
};

// @desc    Get the chat history for the logged-in user
// @route   GET /api/chatbot/history
// @access  Private
exports.getChatHistory = async (req, res) => {
  const userId = req.user._id; // <- Use standard _id for reliability

  try {
    const conversation = await ChatConversation.findOne({ userId });

    if (!conversation) {
      return res.json({ messages: [] });
    }

    res.json({ messages: conversation.messages });

  } catch (error) {
    console.error('Chat history retrieval error:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de l\'historique.' });
  }
};
