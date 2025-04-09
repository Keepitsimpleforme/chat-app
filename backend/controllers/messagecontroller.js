const Message = require('../models/message');

exports.sendMessage = async (req, res) => {
  try {
    const message = new Message({
      sender: req.user.id,
      receiver: req.body.receiver,
      text: req.body.text,
    });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get messages', error });
  }
};