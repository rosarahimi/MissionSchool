const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// ── Register ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, grade, studentEmail, studentPassword } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'ایمیل و رمز عبور الزامی هستند.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'این ایمیل قبلاً ثبت‌نام شده است.' });
    }

    let linkedStudentId = null;

    if (role === 'parent') {
      if (!studentEmail || !studentPassword) {
        return res.status(400).json({ error: 'ایمیل و رمز عبور دانش‌آموز الزامی است.' });
      }

      let student = await User.findOne({ email: studentEmail });
      
      if (student) {
        // Student exists, check password
        const isMatch = await student.comparePassword(studentPassword);
        if (!isMatch) {
          return res.status(401).json({ error: 'رمز عبور دانش‌آموز اشتباه است.' });
        }
        linkedStudentId = student._id;
      } else {
        // Student doesn't exist, create student account first
        const newStudent = new User({
          email: studentEmail,
          password: studentPassword,
          role: 'student',
          grade: grade || 3
        });
        await newStudent.save();
        linkedStudentId = newStudent._id;
      }
    }

    const user = new User({ 
      email, 
      password, 
      role: role || 'student', 
      grade: grade || 3,
      linkedStudent: linkedStudentId
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'خطای سرور. دوباره تلاش کنید.' });
  }
});

// ── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'ایمیل و رمز عبور الزامی هستند.' });
    }

    console.log('Looking for user:', email);
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'ایمیل یا رمز عبور اشتباه است.' });
    }

    const teacherEmails = String(process.env.TEACHER_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    if (teacherEmails.includes(String(user.email).toLowerCase()) && user.role !== 'teacher') {
      user.role = 'teacher';
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    console.log('Login successful for:', email);
    res.json({ token, email: user.email });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'خطای سرور: ' + error.message });
  }
});

module.exports = router;
