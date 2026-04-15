const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Sanitize user object
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ 
      message: 'User registered successfully', 
      token, 
      user: userObj 
    });
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

    if (user.isActive === false) {
      return res.status(403).json({ message: 'حساب کاربری غیرفعال است.' });
    }

    const adminEmails = String(process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const teacherEmails = String(process.env.TEACHER_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = String(user.email).toLowerCase();
    let roleChanged = false;

    if (adminEmails.includes(userEmail)) {
      if (user.role !== 'admin') {
        user.role = 'admin';
        roleChanged = true;
      }
    } else if (teacherEmails.includes(userEmail)) {
      if (user.role !== 'teacher') {
        user.role = 'teacher';
        roleChanged = true;
      }
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    console.log('Login successful for:', email);
    
    // Sanitize user object
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.resetPasswordTokenHash;
    delete userObj.resetPasswordExpiresAt;

    res.json({ token, user: userObj });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'خطای سرور: ' + error.message });
  }
});

// ── Forgot Password ─────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'ایمیل الزامی است.' });
    }

    const user = await User.findOne({ email });
    // Do not reveal whether the email exists.
    if (!user) {
      return res.json({ ok: true, message: 'اگر این ایمیل وجود داشته باشد، لینک بازیابی ارسال می‌شود.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordTokenHash = tokenHash;
    const expireMinutes = Number(process.env.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES || 30);
    user.resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * expireMinutes);
    await user.save();

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USERNAME;
    const smtpPass = process.env.SMTP_PASSWORD;
    const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;
    const useTls = String(process.env.SMTP_USE_TLS || 'true').toLowerCase() === 'true';
    const useSsl = String(process.env.SMTP_USE_SSL || 'false').toLowerCase() === 'true';

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/?resetEmail=${encodeURIComponent(String(email))}&resetToken=${encodeURIComponent(token)}`;

    // If SMTP isn't configured, fall back to returning token for development.
    const canSendEmail = !!(smtpHost && smtpUser && smtpPass && fromEmail);

    if (canSendEmail) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: useSsl,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
        });

        await transporter.sendMail({
          from: fromEmail,
          to: String(email),
          subject: 'بازیابی رمز عبور',
          text:
            `برای بازیابی رمز عبور از لینک زیر استفاده کنید (اعتبار: ${expireMinutes} دقیقه):\n` +
            `${resetLink}\n\n` +
            `یا این توکن را در برنامه وارد کنید:\n${token}`,
        });

        return res.json({ ok: true, message: 'لینک بازیابی ارسال شد.' });
      } catch (mailError) {
        console.error('Forgot password email error:', mailError);
        // Fall back to returning token so the user isn't blocked in dev.
        return res.json({ ok: true, message: 'توکن بازیابی ایجاد شد.', token });
      }
    }

    // Dev fallback
    return res.json({ ok: true, message: 'توکن بازیابی ایجاد شد.', token });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'خطای سرور. دوباره تلاش کنید.' });
  }
});

// ── Reset Password ──────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'ایمیل، توکن و رمز جدید الزامی هستند.' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordTokenHash || !user.resetPasswordExpiresAt) {
      return res.status(400).json({ message: 'توکن نامعتبر است.' });
    }
    if (user.resetPasswordExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'توکن منقضی شده است.' });
    }

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    if (tokenHash !== user.resetPasswordTokenHash) {
      return res.status(400).json({ message: 'توکن نامعتبر است.' });
    }

    user.password = String(newPassword);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    return res.json({ ok: true, message: 'رمز عبور با موفقیت تغییر کرد.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'خطای سرور. دوباره تلاش کنید.' });
  }
});

module.exports = router;
