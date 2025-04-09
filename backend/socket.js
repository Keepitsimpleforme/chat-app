let onlineUsers = [];
const userSchema = require('./models/user');
const Message = require('./models/message');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    console.log('Current online users:', onlineUsers);

    // Add user to online list
    socket.on('addUser', async (userId) => {
      console.log('addUser event received for userId:', userId);
      
      if (!onlineUsers.some((user) => user.userId === userId)) {
        onlineUsers.push({ userId, socketId: socket.id });
        console.log('User added to online list. Updated list:', onlineUsers);
      } else {
        console.log('User already in online list');
      }

      // Fetch user details from database
      try {
        const user = await userSchema.findById(userId);
        console.log('Fetched user details:', user);
        
        if (user) {
          // Update the user name in the online users list
          const userIndex = onlineUsers.findIndex(u => u.userId === userId);
          if (userIndex !== -1) {
            onlineUsers[userIndex].userName = user.UserName;
            console.log('Updated user name in online list');
          }
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }

      // Emit updated list to all clients
      const formattedUsers = onlineUsers.map((u) => ({
        id: u.userId,
        name: u.userName || `User ${u.userId}`, // Use actual name if available
      }));
      console.log('Emitting onlineUsers event with:', formattedUsers);
      io.emit('onlineUsers', formattedUsers);
    });

    // Handle sendMessage event
    socket.on('sendMessage', async (message) => {
      console.log('sendMessage event received:', message);
      const { senderId, receiverId, content } = message;
      
      try {
        // Save message to database
        const newMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          text: content
        });
        
        console.log('Message saved to database:', newMessage);
        
        // Format the message for both sender and receiver
        const formattedMessage = {
          id: newMessage._id,
          senderId: senderId,
          receiverId: receiverId,
          content: content,
          timestamp: newMessage.createdAt.getTime(), // Convert to milliseconds timestamp
        };
        
        // Find receiver's socket
        const receiver = onlineUsers.find((user) => user.userId === receiverId);
        if (receiver) {
          // Send message to receiver
          io.to(receiver.socketId).emit('receiveMessage', formattedMessage);
        }
        
        // Send confirmation back to sender with the same formatted message
        socket.emit('messageSent', formattedMessage);
        
        // Also emit to the sender's socket to ensure they see their own messages
        io.to(socket.id).emit('receiveMessage', formattedMessage);
        
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('messageError', { error: 'Failed to save message' });
      }
    });

    // On disconnect, remove user
    socket.on('disconnect', () => {
      console.log('User disconnecting:', socket.id);
      onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
      console.log('Updated online users after disconnect:', onlineUsers);

      const formattedUsers = onlineUsers.map((u) => ({
        id: u.userId,
        name: u.userName || `User ${u.userId}`, // Use actual name if available
      }));
      console.log('Emitting onlineUsers event after disconnect:', formattedUsers);
      io.emit('onlineUsers', formattedUsers);

      console.log('A user disconnected:', socket.id);
    });
  });
};