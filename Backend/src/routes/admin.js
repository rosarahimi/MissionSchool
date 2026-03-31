const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/User');
const PerformanceReport = require('../models/PerformanceReport');

function makeTempPassword() {
  return crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
}

async function findLinkedParentForStudent(studentId) {
  if (!studentId) return null;
  const parent = await User.findOne({ role: 'parent', linkedStudent: studentId }).select('email name role grade isActive lastLoginAt createdAt');
  return parent ? parent.toObject() : null;
}

router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const { q, role, grade, status, limit, skip } = req.query;

    const query = {};
    if (role) query.role = String(role);
    if (grade !== undefined && grade !== null && String(grade).trim() !== '') query.grade = Number(grade);
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const qStr = String(q || '').trim();
    if (qStr) {
      query.$or = [
        { email: { $regex: qStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { name: { $regex: qStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      ];
    }

    const pageLimit = Math.max(1, Math.min(200, Number(limit) || 50));
    const pageSkip = Math.max(0, Number(skip) || 0);

    const users = await User.find(query)
      .select('email name role grade linkedStudent isActive lastLoginAt createdAt')
      .sort({ createdAt: -1 })
      .skip(pageSkip)
      .limit(pageLimit)
      .lean();

    const userIds = users.map(u => u._id);
    const reportAgg = await PerformanceReport.aggregate([
      { $match: { studentId: { $in: userIds } } },
      {
        $group: {
          _id: '$studentId',
          reportsCount: { $sum: 1 },
          lastReportAt: { $max: '$createdAt' },
          totalScore: { $sum: '$score' },
        }
      }
    ]);

    const reportMap = new Map(reportAgg.map(r => [String(r._id), r]));

    const parentIds = users.filter(u => u.role === 'parent' && u.linkedStudent).map(u => u.linkedStudent);
    const studentsForParents = parentIds.length
      ? await User.find({ _id: { $in: parentIds } }).select('email name grade role isActive lastLoginAt createdAt').lean()
      : [];
    const studentMap = new Map(studentsForParents.map(s => [String(s._id), s]));

    const studentIds = users.filter(u => u.role === 'student').map(u => u._id);
    const parentsForStudents = studentIds.length
      ? await User.find({ role: 'parent', linkedStudent: { $in: studentIds } }).select('email name linkedStudent').lean()
      : [];
    const parentMap = new Map(parentsForStudents.map(p => [String(p.linkedStudent), { _id: p._id, email: p.email, name: p.name }]));

    const enriched = users.map(u => {
      const rep = reportMap.get(String(u._id)) || null;
      const linkedChild = u.role === 'parent' && u.linkedStudent ? studentMap.get(String(u.linkedStudent)) : null;
      const linkedParent = u.role === 'student' ? (parentMap.get(String(u._id)) || null) : null;

      return {
        ...u,
        reportsCount: rep?.reportsCount || 0,
        lastReportAt: rep?.lastReportAt || null,
        totalScore: rep?.totalScore || 0,
        linkedStudent: linkedChild || (u.linkedStudent || null),
        linkedParent: linkedParent,
      };
    });

    const total = await User.countDocuments(query);

    res.json({ ok: true, total, users: enriched, limit: pageLimit, skip: pageSkip });
  } catch (err) {
    console.error('Admin users list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .select('email name role grade linkedStudent isActive lastLoginAt createdAt badges lessonProgress')
      .populate('linkedStudent', 'email name role grade isActive lastLoginAt createdAt')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    const linkedParent = user.role === 'student' ? await findLinkedParentForStudent(user._id) : null;

    let reports = [];
    if (user.role === 'student') {
      reports = await PerformanceReport.find({ studentId: user._id }).sort({ createdAt: -1 }).limit(200).lean();
    } else if (user.role === 'parent' && user.linkedStudent) {
      reports = await PerformanceReport.find({ studentId: user.linkedStudent._id || user.linkedStudent }).sort({ createdAt: -1 }).limit(200).lean();
    }

    res.json({ ok: true, user: { ...user, linkedParent }, reports });
  } catch (err) {
    console.error('Admin user details error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role, grade, isActive, name } = req.body || {};

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (role !== undefined) {
      const nextRole = String(role);
      if (!['student', 'parent', 'teacher', 'admin'].includes(nextRole)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = nextRole;
    }

    if (grade !== undefined && grade !== null && String(grade).trim() !== '') user.grade = Number(grade);
    if (isActive !== undefined) user.isActive = !!isActive;
    if (name !== undefined) user.name = String(name);

    await user.save();

    const safe = await User.findById(userId)
      .select('email name role grade linkedStudent isActive lastLoginAt createdAt')
      .populate('linkedStudent', 'email name role grade isActive lastLoginAt createdAt')
      .lean();

    res.json({ ok: true, user: safe });
  } catch (err) {
    console.error('Admin user patch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users/:id/reset-password', auth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const tempPassword = makeTempPassword();
    user.password = tempPassword;
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    res.json({ ok: true, tempPassword });
  } catch (err) {
    console.error('Admin reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
