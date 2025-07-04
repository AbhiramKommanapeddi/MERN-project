const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to log activity
const logActivity = async (action, taskId, userId, details, description) => {
  try {
    const activity = new Activity({
      action,
      taskId,
      userId,
      details,
      description
    });
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Helper function to calculate task counts for smart assign
const getTaskCounts = async () => {
  const pipeline = [
    {
      $match: { status: { $in: ['todo', 'in-progress'] } }
    },
    {
      $group: {
        _id: '$assignedTo',
        count: { $sum: 1 }
      }
    }
  ];
  
  const results = await Task.aggregate(pipeline);
  const taskCounts = {};
  results.forEach(result => {
    taskCounts[result._id.toString()] = result.count;
  });
  
  return taskCounts;
};

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'username email avatar')
      .populate('createdBy', 'username email avatar')
      .populate('editedBy', 'username email avatar')
      .sort({ status: 1, order: 1, createdAt: -1 });
    
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, assignedTo, priority = 'medium' } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Title and assigned user are required' });
    }

    // Check if title already exists
    const existingTask = await Task.findOne({ title: title.trim() });
    if (existingTask) {
      return res.status(400).json({ message: 'Task title must be unique' });
    }

    // Validate assigned user
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({ message: 'Assigned user not found' });
    }

    // Get the next order number for todo status
    const lastTask = await Task.findOne({ status: 'todo' }).sort({ order: -1 });
    const order = lastTask ? lastTask.order + 1 : 0;

    const task = new Task({
      title: title.trim(),
      description: description?.trim() || '',
      assignedTo,
      createdBy: req.user._id,
      priority,
      order,
      lastModifiedBy: req.user._id
    });

    await task.save();
    await task.populate('assignedTo', 'username email avatar');
    await task.populate('createdBy', 'username email avatar');

    // Log activity
    await logActivity(
      'create',
      task._id,
      req.user._id,
      { assignedTo },
      `${req.user.username} created task "${task.title}"`
    );

    res.status(201).json({ task, message: 'Task created successfully' });
  } catch (error) {
    console.error('Create task error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Task title must be unique' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check for conflicts
    if (task.isBeingEdited && task.editedBy && 
        task.editedBy.toString() !== req.user._id.toString()) {
      
      // Check if edit session is still active (5 minutes timeout)
      const editTimeout = 5 * 60 * 1000; // 5 minutes
      if (new Date() - task.editStartTime < editTimeout) {
        const editedBy = await User.findById(task.editedBy);
        return res.status(409).json({ 
          message: 'Task is being edited by another user',
          conflict: true,
          editedBy: editedBy ? editedBy.username : 'Unknown user',
          currentVersion: task
        });
      }
    }

    // Store previous values for activity logging
    const previousValues = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo
    };

    // Handle title uniqueness check
    if (updates.title && updates.title !== task.title) {
      const existingTask = await Task.findOne({ 
        title: updates.title.trim(),
        _id: { $ne: id }
      });
      if (existingTask) {
        return res.status(400).json({ message: 'Task title must be unique' });
      }
    }

    // Update task
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
        task[key] = updates[key];
      }
    });

    task.lastModifiedBy = req.user._id;
    task.version += 1;
    task.isBeingEdited = false;
    task.editedBy = null;
    task.editStartTime = null;

    await task.save();
    await task.populate('assignedTo', 'username email avatar');
    await task.populate('createdBy', 'username email avatar');

    // Log activities for changed fields
    for (const [field, newValue] of Object.entries(updates)) {
      if (previousValues[field] !== undefined && 
          previousValues[field].toString() !== newValue.toString()) {
        
        let description;
        let activityDetails = {
          field,
          oldValue: previousValues[field],
          newValue
        };

        switch (field) {
          case 'title':
            description = `${req.user.username} changed title from "${previousValues[field]}" to "${newValue}"`;
            break;
          case 'description':
            description = `${req.user.username} updated description`;
            break;
          case 'status':
            description = `${req.user.username} moved task to ${newValue.replace('-', ' ')}`;
            activityDetails.previousStatus = previousValues[field];
            activityDetails.newStatus = newValue;
            break;
          case 'priority':
            description = `${req.user.username} changed priority to ${newValue}`;
            break;
          case 'assignedTo':
            const oldUser = await User.findById(previousValues[field]);
            const newUser = await User.findById(newValue);
            description = `${req.user.username} reassigned task from ${oldUser?.username || 'Unknown'} to ${newUser?.username || 'Unknown'}`;
            activityDetails.previousAssignee = previousValues[field];
            activityDetails.newAssignee = newValue;
            break;
          default:
            description = `${req.user.username} updated ${field}`;
        }

        await logActivity(
          field === 'status' ? 'move' : field === 'assignedTo' ? 'assign' : 'update',
          task._id,
          req.user._id,
          activityDetails,
          description
        );
      }
    }

    res.json({ task, message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Task title must be unique' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user can delete (creator or assigned user)
    if (task.createdBy.toString() !== req.user._id.toString() && 
        task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(id);

    // Log activity
    await logActivity(
      'delete',
      task._id,
      req.user._id,
      { title: task.title },
      `${req.user.username} deleted task "${task.title}"`
    );

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Smart assign task
router.post('/:id/smart-assign', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get all users and their task counts
    const users = await User.find({}, '_id username');
    const taskCounts = await getTaskCounts();

    // Find user with fewest active tasks
    let minTasks = Infinity;
    let selectedUser = null;

    users.forEach(user => {
      const userTaskCount = taskCounts[user._id.toString()] || 0;
      if (userTaskCount < minTasks) {
        minTasks = userTaskCount;
        selectedUser = user;
      }
    });

    if (!selectedUser) {
      return res.status(400).json({ message: 'No users available for assignment' });
    }

    const previousAssignee = task.assignedTo;
    task.assignedTo = selectedUser._id;
    task.lastModifiedBy = req.user._id;
    task.version += 1;

    await task.save();
    await task.populate('assignedTo', 'username email avatar');
    await task.populate('createdBy', 'username email avatar');

    // Log activity
    const prevUser = await User.findById(previousAssignee);
    await logActivity(
      'smart_assign',
      task._id,
      req.user._id,
      {
        previousAssignee,
        newAssignee: selectedUser._id,
        taskCount: minTasks
      },
      `${req.user.username} smart-assigned task to ${selectedUser.username} (${minTasks} active tasks)`
    );

    res.json({ 
      task, 
      message: `Task smart-assigned to ${selectedUser.username}`,
      assignedTo: selectedUser.username,
      taskCount: minTasks
    });
  } catch (error) {
    console.error('Smart assign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start editing task (lock for conflict prevention)
router.post('/:id/start-edit', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if already being edited by someone else
    if (task.isBeingEdited && task.editedBy && 
        task.editedBy.toString() !== req.user._id.toString()) {
      
      const editTimeout = 5 * 60 * 1000; // 5 minutes
      if (new Date() - task.editStartTime < editTimeout) {
        const editedBy = await User.findById(task.editedBy);
        return res.status(409).json({ 
          message: 'Task is being edited by another user',
          editedBy: editedBy ? editedBy.username : 'Unknown user'
        });
      }
    }

    task.isBeingEdited = true;
    task.editedBy = req.user._id;
    task.editStartTime = new Date();
    await task.save();

    res.json({ message: 'Edit session started' });
  } catch (error) {
    console.error('Start edit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End editing task (unlock)
router.post('/:id/end-edit', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.editedBy && task.editedBy.toString() === req.user._id.toString()) {
      task.isBeingEdited = false;
      task.editedBy = null;
      task.editStartTime = null;
      await task.save();
    }

    res.json({ message: 'Edit session ended' });
  } catch (error) {
    console.error('End edit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reorder tasks
router.post('/reorder', auth, async (req, res) => {
  try {
    const { tasks } = req.body; // Array of {id, status, order}

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: 'Tasks must be an array' });
    }

    const bulkOps = tasks.map(({ id, status, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { 
          status, 
          order, 
          lastModifiedBy: req.user._id,
          $inc: { version: 1 }
        }
      }
    }));

    await Task.bulkWrite(bulkOps);

    // Log reorder activity
    await logActivity(
      'move',
      null,
      req.user._id,
      { taskCount: tasks.length },
      `${req.user.username} reordered ${tasks.length} tasks`
    );

    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
