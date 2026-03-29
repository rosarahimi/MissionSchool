const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
const PerformanceReport = require('../models/PerformanceReport');

const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'دسترسی فقط برای معلم' });
  }
  next();
};

// Get user profile/history
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('linkedStudent', '-password');
    
    const userObj = user.toObject();
    
    // If student, find the parent linked to them
    if (user.role === 'student') {
      const parent = await User.findOne({ 
        role: 'parent', 
        linkedStudent: user._id 
      }).select('email name');
      
      if (parent) {
        userObj.linkedParent = parent;
      }
    }
    
    // Get latest performance summary for the profile
    const reportCount = await PerformanceReport.countDocuments({ studentId: user._id });
    userObj.totalReports = reportCount;
    
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (name)
router.post('/profile/update', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name;
    
    await user.save();
    res.json({ message: 'Profile updated', user: { email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new performance report (save mission results)
router.post('/progress', auth, async (req, res) => {
  try {
    const { subject, score, stars, badge, detailedResults, lessonId, sessionDuration } = req.body;
    
    // Create performance report in separate collection
    const report = new PerformanceReport({
      studentId: req.user.id,
      subject,
      score,
      stars: stars || 0,
      badge: badge || null,
      detailedResults: detailedResults || [],
      lessonId: lessonId || null,
      sessionDuration: sessionDuration || 0
    });
    
    await report.save();
    
    // Also update user's badge list (quick reference)
    const user = await User.findById(req.user.id);
    if (badge && !user.badges.includes(badge)) {
      user.badges.push(badge);
      await user.save();
    }
    
    res.json({ message: 'Report saved', reportId: report._id });
  } catch (err) {
    console.error('Error saving progress:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get results (detailed performance) - for student, parent, or teacher
router.get('/results', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role === 'parent' && user.linkedStudent) {
      // Parent viewing linked student's results
      const student = await User.findById(user.linkedStudent).select('name email grade');
      const reports = await PerformanceReport.find({ studentId: user.linkedStudent })
        .sort({ createdAt: -1 })
        .lean();
      
      return res.json({
        studentName: student.name,
        studentEmail: student.email,
        grade: student.grade,
        scores: reports
      });
      
    } else if (user.role === 'student') {
      // Student viewing their own results
      const reports = await PerformanceReport.find({ studentId: user._id })
        .sort({ createdAt: -1 })
        .lean();
      
      return res.json({
        studentName: user.name,
        studentEmail: user.email,
        grade: user.grade,
        scores: reports
      });
      
    } else if (user.role === 'teacher' || user.role === 'admin') {
      // Teacher viewing their students' results
      const { grade, subject, studentId } = req.query;
      
      let query = { role: 'student' };
      if (grade) query.grade = Number(grade);
      
      const students = await User.find(query)
        .select('name email grade')
        .sort({ grade: 1, name: 1 });
      
      // Get reports for each student
      const results = await Promise.all(
        students.map(async (s) => {
          let reportQuery = { studentId: s._id };
          if (subject) reportQuery.subject = subject;
          
          const reports = await PerformanceReport.find(reportQuery)
            .sort({ createdAt: -1 })
            .lean();
          
          return {
            studentId: s._id,
            studentName: s.name,
            studentEmail: s.email,
            grade: s.grade,
            scores: reports
          };
        })
      );
      
      // If specific studentId requested, filter to just that student
      const filteredResults = studentId 
        ? results.filter(r => String(r.studentId) === studentId)
        : results;
      
      return res.json({
        teacherView: true,
        students: filteredResults
      });
    } else {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Teacher: Get specific student's detailed results
router.get('/results/:studentId', auth, requireTeacher, async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId).select('name email grade');
    
    if (!student) {
      return res.status(404).json({ message: 'دانش‌آموز یافت نشد' });
    }
    
    const reports = await PerformanceReport.find({ studentId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      grade: student.grade,
      scores: reports
    });
  } catch (err) {
    console.error('Error fetching student results:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
