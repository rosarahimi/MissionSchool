const User = require('../models/User');

const requireTeacher = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('role');
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.role !== 'teacher' && user.role !== 'admin') return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = requireTeacher;
