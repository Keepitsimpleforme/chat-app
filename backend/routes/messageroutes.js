const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messagecontroller');
const authMiddleware = require('../middlware/authmiddleware');
const Message = require('../models/message');

// Send a message
router.post('/', authMiddleware, messageController.sendMessage);

// Get all messages between two users
router.get('/:userId', authMiddleware, messageController.getMessages);

// GET /api/messages - Get chat history between two users
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query; // The other user's ID
    const currentUserId = req.user.id;

    console.log('Fetching messages between users:', { currentUserId, userId });

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find messages where either user is sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .sort({ createdAt: 1 }) // Sort by creation time, oldest first
    .populate('sender', 'UserName') // Populate sender details
    .populate('receiver', 'UserName'); // Populate receiver details

    console.log('Found messages:', messages);

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      senderId: msg.sender._id,
      receiverId: msg.receiver._id,
      content: msg.text,
      timestamp: msg.createdAt.getTime(), // Convert to milliseconds timestamp
      senderName: msg.sender.UserName,
      receiverName: msg.receiver.UserName
    }));

    console.log('Formatted messages:', formattedMessages);
    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

module.exports = router;