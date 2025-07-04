const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'assign', 'move', 'status_change', 'smart_assign']
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  details: {
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    previousStatus: String,
    newStatus: String,
    previousAssignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    newAssignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
activitySchema.index({ timestamp: -1 });
activitySchema.index({ taskId: 1, timestamp: -1 });
activitySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);
