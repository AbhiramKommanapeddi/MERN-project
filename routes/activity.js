const express = require('express');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const router = express.Router();

// Get recent activities (last 20)
router.get('/', auth, async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('userId', 'username email avatar')
      .populate('taskId', 'title status')
      .populate('details.previousAssignee', 'username email avatar')
      .populate('details.newAssignee', 'username email avatar')
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({ activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activities for a specific task
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const activities = await Activity.find({ taskId })
      .populate('userId', 'username email avatar')
      .populate('details.previousAssignee', 'username email avatar')
      .populate('details.newAssignee', 'username email avatar')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({ activities });
  } catch (error) {
    console.error('Get task activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activities by user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const activities = await Activity.find({ userId })
      .populate('userId', 'username email avatar')
      .populate('taskId', 'title status')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({ activities });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
