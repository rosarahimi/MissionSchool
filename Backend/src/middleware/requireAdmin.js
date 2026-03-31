const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('role isActive');
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.isActive === false) return res.status(403).json({ message: 'حساب غیرفعال است' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = requireAdmin;
