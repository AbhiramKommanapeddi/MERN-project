const jwt = require('jsonwebtoken');
const User = require('../models/User');

const connectedUsers = new Map(); // userId -> { socketId, user }

const socketHandler = (io) => {
  // Authentication middleware for socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.username} connected: ${socket.id}`);

    // Update user status
    try {
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: new Date()
      });

      // Store connection
      connectedUsers.set(socket.userId, {
        socketId: socket.id,
        user: socket.user
      });

      // Notify others about user coming online
      socket.broadcast.emit('user_online', {
        userId: socket.userId,
        username: socket.user.username
      });

      // Send current online users to the newly connected user
      const onlineUsers = Array.from(connectedUsers.values()).map(conn => ({
        id: conn.user._id,
        username: conn.user.username,
        avatar: conn.user.avatar
      }));
      
      socket.emit('online_users', onlineUsers);

    } catch (error) {
      console.error('Error updating user status:', error);
    }

    // Handle task creation
    socket.on('task_created', (data) => {
      socket.broadcast.emit('task_created', data);
    });

    // Handle task updates
    socket.on('task_updated', (data) => {
      socket.broadcast.emit('task_updated', data);
    });

    // Handle task deletion
    socket.on('task_deleted', (data) => {
      socket.broadcast.emit('task_deleted', data);
    });

    // Handle task status change
    socket.on('task_moved', (data) => {
      socket.broadcast.emit('task_moved', data);
    });

    // Handle task assignment
    socket.on('task_assigned', (data) => {
      socket.broadcast.emit('task_assigned', data);
    });

    // Handle smart assignment
    socket.on('task_smart_assigned', (data) => {
      socket.broadcast.emit('task_smart_assigned', data);
    });

    // Handle task reordering
    socket.on('tasks_reordered', (data) => {
      socket.broadcast.emit('tasks_reordered', data);
    });

    // Handle activity logging
    socket.on('new_activity', (activity) => {
      socket.broadcast.emit('new_activity', activity);
    });

    // Handle edit session start
    socket.on('edit_started', (data) => {
      socket.broadcast.emit('edit_started', {
        ...data,
        editedBy: socket.user.username
      });
    });

    // Handle edit session end
    socket.on('edit_ended', (data) => {
      socket.broadcast.emit('edit_ended', data);
    });

    // Handle conflict detection
    socket.on('conflict_detected', (data) => {
      // Notify all users about the conflict
      io.emit('conflict_detected', {
        ...data,
        conflictUsers: [
          socket.user.username,
          data.otherUser
        ]
      });
    });

    // Handle conflict resolution
    socket.on('conflict_resolved', (data) => {
      socket.broadcast.emit('conflict_resolved', data);
    });

    // Handle typing indicators for task editing
    socket.on('typing_start', (data) => {
      socket.broadcast.emit('typing_start', {
        taskId: data.taskId,
        userId: socket.userId,
        username: socket.user.username
      });
    });

    socket.on('typing_stop', (data) => {
      socket.broadcast.emit('typing_stop', {
        taskId: data.taskId,
        userId: socket.userId
      });
    });

    // Handle user cursor position (for collaborative editing indication)
    socket.on('cursor_position', (data) => {
      socket.broadcast.emit('cursor_position', {
        ...data,
        userId: socket.userId,
        username: socket.user.username
      });
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.username} disconnected: ${socket.id}`);

      try {
        // Update user status
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        });

        // Remove from connected users
        connectedUsers.delete(socket.userId);

        // Notify others about user going offline
        socket.broadcast.emit('user_offline', {
          userId: socket.userId,
          username: socket.user.username
        });

        // End any active edit sessions
        socket.broadcast.emit('edit_ended', {
          userId: socket.userId,
          username: socket.user.username
        });

      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Periodic cleanup of stale edit sessions
  setInterval(async () => {
    try {
      const staleTimeout = 5 * 60 * 1000; // 5 minutes
      const staleTime = new Date(Date.now() - staleTimeout);
      
      // Find tasks with stale edit sessions
      const Task = require('../models/Task');
      const staleTasks = await Task.find({
        isBeingEdited: true,
        editStartTime: { $lt: staleTime }
      });

      if (staleTasks.length > 0) {
        await Task.updateMany(
          {
            isBeingEdited: true,
            editStartTime: { $lt: staleTime }
          },
          {
            isBeingEdited: false,
            editedBy: null,
            editStartTime: null
          }
        );

        // Notify clients about freed tasks
        staleTasks.forEach(task => {
          io.emit('edit_session_expired', {
            taskId: task._id.toString()
          });
        });

        console.log(`Cleaned up ${staleTasks.length} stale edit sessions`);
      }
    } catch (error) {
      console.error('Error in cleanup task:', error);
    }
  }, 60000); // Run every minute
};

module.exports = socketHandler;
