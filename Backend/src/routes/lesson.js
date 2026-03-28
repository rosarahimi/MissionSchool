const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const mongoose = require('mongoose');
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-pdf', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) throw new Error("فایلی ارسال نشده است.");
    const subject = req.body.subject || 'unknown';
    const grade = req.body.grade ? Number(req.body.grade) : undefined;
    const safeSubject = String(subject).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const safeGrade = Number.isFinite(grade) ? String(grade) : null;
    const pdfBaseName = safeGrade ? `${safeSubject}-${safeGrade}` : safeSubject;
    const pdfFilename = `${pdfBaseName}.pdf`;

    const tempDir = path.join(__dirname, '../../uploads/textbooks');
    await fs.promises.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, pdfFilename);
    await fs.promises.writeFile(tempPath, req.file.buffer);
    
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'textbooks' });

    // Find and delete existing textbook for this subject to replace it safely
    const existing = await bucket.find({ filename: pdfFilename }).toArray();
    for (const file of existing) {
      await bucket.delete(file._id);
    }

    // Stream from buffer to GridFS
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    const uploadStream = bucket.openUploadStream(pdfFilename, {
      contentType: 'application/pdf',
      metadata: { subject, grade }
    });

    readableStream.pipe(uploadStream)
      .on('error', (err) => {
        res.status(500).json({ success: false, error: err.message });
      })
      .on('finish', () => {
        const courseTitle = safeSubject === 'persian'
          ? `فارسی پایه ${safeGrade || ''}`.trim()
          : `${safeSubject}${safeGrade ? ` grade ${safeGrade}` : ''}`.trim();
        Course.findOneAndUpdate(
          { grade: grade, subject: safeSubject },
          {
            $set: {
              grade: grade,
              subject: safeSubject,
              title: courseTitle,
              textbook: { bucketName: 'textbooks', filename: pdfFilename }
            }
          },
          { upsert: true, new: true }
        ).catch(() => {});

        res.json({
          success: true,
          message: "فایل کتاب با موفقیت در دیتابیس آپلود شد.",
          filename: pdfFilename,
          tempUrl: `/uploads/textbooks/${pdfFilename}`,
        });
      });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/pdf-status/:subject/:grade?', auth, async (req, res) => {
  try {
    const subject = req.params.subject;
    const grade = req.params.grade ? Number(req.params.grade) : (req.query.grade ? Number(req.query.grade) : undefined);
    const safeSubject = String(subject).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const safeGrade = Number.isFinite(grade) ? String(grade) : null;
    const pdfBaseName = safeGrade ? `${safeSubject}-${safeGrade}` : safeSubject;
    const pdfFilename = `${pdfBaseName}.pdf`;
    const db = mongoose.connection.db;
    if (!db) return res.json({ exists: false });
    
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'textbooks' });
    const files = await bucket.find({ filename: pdfFilename }).toArray();
    
    if (files && files.length > 0) {
      res.json({ exists: true, url: `/api/lessons/pdf/${safeSubject}${safeGrade ? `/${safeGrade}` : ''}` });
    } else {
      res.json({ exists: false });
    }
  } catch(err) {
    res.json({ exists: false });
  }
});

router.get('/pdf/:subject/:grade?', async (req, res) => {
  try {
    const subject = req.params.subject;
    const grade = req.params.grade ? Number(req.params.grade) : (req.query.grade ? Number(req.query.grade) : undefined);
    const safeSubject = String(subject).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const safeGrade = Number.isFinite(grade) ? String(grade) : null;
    const pdfBaseName = safeGrade ? `${safeSubject}-${safeGrade}` : safeSubject;
    const pdfFilename = `${pdfBaseName}.pdf`;
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'textbooks' });

    const files = await bucket.find({ filename: pdfFilename }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).send('Textbook not found in database');
    }

    res.set('Content-Type', 'application/pdf');
    bucket.openDownloadStreamByName(pdfFilename).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all lessons for a subject, returning titles and progress
router.get('/:subject', auth, async (req, res) => {
  try {
    const lessons = await Lesson.find({ subject: req.params.subject })
      .select('title chapter subject')
      .sort({ chapter: 1 });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific lesson by ID (includes content and missions)
router.get('/details/:id', auth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed Persian Lessons (Dev)
router.post('/seed', async (req, res) => {
  try {
    const persianLessons = [
      {
        subject: 'persian',
        chapter: 1,
        title: 'محله‌ی ما',
        content: `درس اول: محله‌ی ما (فارسی سوم دبستان - ۱۴۰۴/۱۴۰۵)\n\nبه محله‌ی ما خوش آمدید!\nمحله‌ی ما جای بسیار زیبایی است. در این محله، یک پارک بزرگ، یک کتابخانه عمومی و یک مدرسه قرار دارد.\nمردم محله‌ی ما با هم مهربان هستند و در کارها به هم کمک می‌کنند.\nما همیشه محله خود را تمیز نگه می‌داریم و از درختان مراقبت می‌کنیم.\nهمچنین زنگ ورزش، بچه‌ها در حیاط مدرسه فوتبال بازی می‌کنند و صدای خنده‌هایشان در فضا می‌پیچد.`,
        missions: [
          { type: "mcq", stage: 1, q: "کلمه‌ی هم‌معنی «سعی» کدام است؟", options: ["تلاش", "خواب", "دویدن", "غذا"], answer: 0, exp: "سعی به معنی تلاش و کوشش است." },
          { type: "fill", stage: 1, q: "بچه‌ها در حیاط مدرسه ___ بازی می‌کنند.", blank: "فوتبال", hint: "یک نوع ورزش", exp: "فوتبال محبوب‌ترین بازی است." },
          { type: "mcq", stage: 2, q: "مردم محله‌ی ما در کارها چه می‌کنند؟", options: ["دعوا می‌کنند", "به هم کمک می‌کنند", "فقط استراحت می‌کنند", "به هم کاری ندارند"], answer: 1, exp: "مردم محله با هم مهربان هستند و کمک می‌کنند." },
          { type: "order", stage: 2, q: "کلمات را مرتب کن:", words: ["است", "زیبایی", "محله‌ی", "بسیار", "ما", "جای"], answer: "محله‌ی ما جای بسیار زیبایی است", exp: "آرایش درست جمله فاعل مسند فعل است." }
        ]
      },
      {
        subject: 'persian',
        chapter: 2,
        title: 'زنگ ورزش',
        content: `درس دوم: زنگ ورزش\n\nامروز سه‌شنبه است و ما زنگ ورزش داریم.\nمعلم ورزش، آقای مرادی، با سوت وارد حیاط شد. بچه‌ها با خوشحالی به صف شدند.\nابتدا نرمش کردیم و سپس مسابقه‌ی دو انجام دادیم.\nورزش برای سلامتی بدن بسیار مفید است و باعث شادابی ما می‌شود.`,
        missions: [
          { type: "mcq", stage: 1, q: "بچه‌ها چه روزی زنگ ورزش دارند؟", options: ["شنبه", "سه‌شنبه", "دوشنبه", "جمعه"], answer: 1, exp: "در متن آمده که امروز سه‌شنبه است." },
          { type: "fill", stage: 1, q: "معلم ورزش با ___ وارد حیاط شد.", blank: "سوت", hint: "وسیله‌ای در دهان معلم ورزش", exp: "معلم ورزش معمولاً سوت می‌زند." },
          { type: "mcq", stage: 2, q: "ورزش چه فایده‌ای دارد؟", options: ["بیماری می‌آورد", "وقت را تلف می‌کند", "برای سلامتی مفید است", "فقط برای کودکان است"], answer: 2, exp: "ورزش باعث سلامتی و شادابی بدن می‌شود." },
          { type: "order", stage: 2, q: "کلمات را مرتب کن:", words: ["بسیار", "بدن", "برای", "مفید", "ورزش", "سلامتی", "است"], answer: "ورزش برای سلامتی بدن بسیار مفید است", exp: "این جمله را در متن درس خواندیم." }
        ]
      },
      {
        subject: 'persian',
        chapter: 3,
        title: 'آسمان آبی طبیعت پاک',
        content: `درس سوم: آسمان آبی طبیعت پاک\n\nبرای داشتن آسمان آبی، باید هوا را پاکیزه نگه داریم.\nدود ماشین‌ها و آلودگی کارخانه‌ها باعث می‌شوند تا هوا آلوده شود.\nاگر به جای استفاده از ماشین شخصی، از اتوبوس یا قطار استفاده کنیم، هوای شهرمان تمیزتر می‌ماند.\nدرختان ریه‌های زمین هستند و با تصفیه‌ی هوا، به داشتن آسمان آبی کمک شایانی می‌کنند.`,
        missions: [
          { type: "mcq", stage: 1, q: "چه چیزی باعث آلودگی هوا می‌شود؟", options: ["باران", "دود ماشین‌ها", "کاشتن درخت", "وزش باد"], answer: 1, exp: "دود ماشین‌ها باعث کثیفی هوا می‌شود." },
          { type: "fill", stage: 1, q: "درختان ___ زمین هستند.", blank: "ریه‌های", hint: "اندامی برای تنفس", exp: "درختان هوای کره زمین را تمیز می‌کنند." },
          { type: "mcq", stage: 2, q: "به جای ماشین شخصی چه باید استفاده کنیم؟", options: ["موتورسیکلت", "دوچرخه یا اتوبوس", "هواپیما", "هیچ‌کدام"], answer: 1, exp: "حمل و نقل عمومی هوای شهر را تمیز نگه می‌دارد." },
          { type: "order", stage: 2, q: "کلمات را مرتب کن:", words: ["باید", "هوا", "را", "پاکیزه", "نگه", "داریم"], answer: "باید هوا را پاکیزه نگه داریم", exp: "پاکیزگی هوا وظیفه همه ماست." }
        ]
      }
    ];

    await Lesson.deleteMany({ subject: 'persian' });
    await Lesson.insertMany(persianLessons);
    res.json({ message: 'Seeded Persian lessons successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update progress (Read or Completed)
router.post('/progress', auth, async (req, res) => {
  try {
    const { lessonId, field } = req.body; // field: 'read' or 'completed'
    const user = await User.findById(req.user.id);
    let progress = user.lessonProgress.find(p => p.lessonId.toString() === lessonId);
    
    if (!progress) {
      user.lessonProgress.push({ lessonId, read: false, completed: false });
      progress = user.lessonProgress[user.lessonProgress.length - 1];
    }
    
    if (field === 'read') progress.read = true;
    if (field === 'completed') progress.completed = true;

    await user.save();
    res.json({ message: 'Progress updated', progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
