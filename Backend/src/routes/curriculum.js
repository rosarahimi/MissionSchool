const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');
const { Readable } = require('stream');

const auth = require('../middleware/auth');
const requireTeacher = require('../middleware/requireTeacher');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const TextbookText = require('../models/TextbookText');
const { extractTextFromPdf } = require('../services/textExtraction');
const { splitLessonsFa } = require('../services/chapterBuilder');

const upload = multer({ storage: multer.memoryStorage() });

const extractJobs = new Map();
function createJobId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Textbooks (PDF)
router.post('/textbooks/upload', auth, requireTeacher, upload.single('pdf'), async (req, res) => {
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

    const existing = await bucket.find({ filename: pdfFilename }).toArray();
    for (const file of existing) {
      await bucket.delete(file._id);
    }

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

router.get('/textbooks/status/:subject/:grade?', auth, async (req, res) => {
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
      res.json({ exists: true, url: `/api/curriculum/textbooks/pdf/${safeSubject}${safeGrade ? `/${safeGrade}` : ''}` });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    res.json({ exists: false });
  }
});

router.delete('/textbooks/:subject/:grade?', auth, requireTeacher, async (req, res) => {
  try {
    const subject = req.params.subject;
    const grade = req.params.grade ? Number(req.params.grade) : (req.query.grade ? Number(req.query.grade) : undefined);
    const safeSubject = String(subject).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const safeGrade = Number.isFinite(grade) ? String(grade) : null;
    const pdfBaseName = safeGrade ? `${safeSubject}-${safeGrade}` : safeSubject;
    const pdfFilename = `${pdfBaseName}.pdf`;

    const db = mongoose.connection.db;
    if (!db) return res.status(500).json({ error: 'Database not ready' });

    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'textbooks' });
    const existing = await bucket.find({ filename: pdfFilename }).toArray();
    for (const file of existing) {
      await bucket.delete(file._id);
    }

    if (Number.isFinite(grade)) {
      await Course.updateOne(
        { grade: Number(grade), subject: safeSubject },
        { $unset: { textbook: '' } }
      );
    } else {
      await Course.updateMany(
        { subject: safeSubject },
        { $unset: { textbook: '' } }
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/textbooks/pdf/:subject/:grade?', async (req, res) => {
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

router.delete('/lessons/:id', auth, requireTeacher, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    await Lesson.deleteOne({ _id: lesson._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Courses
router.get('/courses', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.grade) filter.grade = Number(req.query.grade);
    if (req.query.subject) filter.subject = req.query.subject;

    const courses = await Course.find(filter).sort({ grade: 1, subject: 1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/courses', auth, requireTeacher, async (req, res) => {
  try {
    const { grade, subject, title, textbook, meta } = req.body;
    if (grade === undefined || grade === null || Number.isNaN(Number(grade))) {
      return res.status(400).json({ error: 'grade is required' });
    }
    if (!subject) return res.status(400).json({ error: 'subject is required' });

    const safeGrade = Number(grade);
    const safeSubject = String(subject).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const courseTitle = title !== undefined && title !== null && String(title).trim()
      ? String(title).trim()
      : (safeSubject === 'persian' ? `فارسی پایه ${safeGrade}` : `${safeSubject} grade ${safeGrade}`);

    const course = await Course.findOneAndUpdate(
      { grade: safeGrade, subject: safeSubject },
      {
        $setOnInsert: { grade: safeGrade, subject: safeSubject },
        $set: {
          title: courseTitle,
          ...(textbook !== undefined ? { textbook } : {}),
          ...(meta !== undefined ? { meta } : {}),
        }
      },
      { upsert: true, new: true }
    );

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/courses/:courseId', auth, requireTeacher, async (req, res) => {
  try {
    const { grade, subject, title, textbook, meta } = req.body;
    const update = {};
    if (grade !== undefined) update.grade = grade;
    if (subject !== undefined) update.subject = subject;
    if (title !== undefined) update.title = title;
    if (textbook !== undefined) update.textbook = textbook;
    if (meta !== undefined) update.meta = meta;

    const course = await Course.findByIdAndUpdate(
      req.params.courseId,
      { $set: update },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/courses/:courseId', auth, requireTeacher, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    await Lesson.deleteMany({ courseId });
    await Chapter.deleteMany({ courseId });
    await Course.deleteOne({ _id: courseId });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chapters
router.get('/courses/:courseId/chapters', auth, async (req, res) => {
  try {
    const chapters = await Chapter.find({ courseId: req.params.courseId }).sort({ number: 1 });
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/courses/:courseId/chapters', auth, requireTeacher, async (req, res) => {
  try {
    const { number, title, summary, source } = req.body;
    const chapter = await Chapter.create({
      courseId: req.params.courseId,
      number,
      title,
      summary,
      source,
    });
    res.status(201).json(chapter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/chapters/:chapterId', auth, requireTeacher, async (req, res) => {
  try {
    const { number, title, summary, source } = req.body;
    const update = {};
    if (number !== undefined) update.number = number;
    if (title !== undefined) update.title = title;
    if (summary !== undefined) update.summary = summary;
    if (source !== undefined) update.source = source;

    const chapter = await Chapter.findByIdAndUpdate(
      req.params.chapterId,
      { $set: update },
      { new: true }
    );
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    if (number !== undefined) {
      await Lesson.updateMany({ chapterId: chapter._id }, { $set: { chapter: number, orderIndex: number } });
    }

    res.json(chapter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/chapters/:chapterId', auth, requireTeacher, async (req, res) => {
  try {
    const chapterId = req.params.chapterId;
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    await Lesson.deleteMany({ chapterId });
    await Chapter.deleteOne({ _id: chapterId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lessons (structured)
router.get('/lessons', auth, async (req, res) => {
  try {
    const filter = {};
    const includeUnlinked = String(req.query.includeUnlinked || '') === '1' || String(req.query.includeUnlinked || '').toLowerCase() === 'true';

    if (req.query.courseId) {
      if (!includeUnlinked) {
        filter.courseId = req.query.courseId;
      } else {
        const course = await Course.findById(req.query.courseId).select('grade subject');
        if (!course) return res.status(404).json({ error: 'Course not found' });

        filter.$and = [
          {
            $or: [
              { courseId: req.query.courseId },
              { courseId: { $exists: false } },
              { courseId: null },
            ]
          },
          { grade: course.grade },
          { subject: course.subject },
        ];
      }
    } else {
      if (req.query.grade && Number.isFinite(Number(req.query.grade))) filter.grade = Number(req.query.grade);
      if (req.query.subject) filter.subject = String(req.query.subject);
    }

    if (req.query.chapterId) filter.chapterId = req.query.chapterId;

    const lessons = await Lesson.find(filter)
      .select('title subject chapter courseId chapterId grade orderIndex')
      .populate('chapterId', 'number title summary')
      .sort({ orderIndex: 1, chapter: 1 });

    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/lessons/:id', auth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('chapterId', 'number title summary');
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lessons/:id/progress', auth, async (req, res) => {
  try {
    const field = req.body?.field;
    const lessonId = req.params.id;

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

router.post('/lessons', auth, requireTeacher, async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };

    const chapterNumber = payload.chapter !== undefined && payload.chapter !== null ? Number(payload.chapter) : null;
    const chapterTitle = payload.chapterTitle !== undefined ? String(payload.chapterTitle || '').trim() : '';
    delete payload.chapterTitle;

    if (payload.courseId && Number.isFinite(chapterNumber)) {
      const inferredTitle = chapterTitle || payload.title || `درس ${chapterNumber}`;
      const summary = payload.content ? String(payload.content).slice(0, 220) : undefined;

      const ch = await Chapter.findOneAndUpdate(
        { courseId: payload.courseId, number: chapterNumber },
        {
          $setOnInsert: {
            courseId: payload.courseId,
            number: chapterNumber,
          },
          $set: {
            title: inferredTitle,
            ...(summary ? { summary } : {}),
          }
        },
        { upsert: true, new: true }
      );

      payload.chapterId = ch._id;
      if (payload.orderIndex === undefined || payload.orderIndex === null) {
        payload.orderIndex = chapterNumber;
      }
    }

    const lesson = await Lesson.create(payload);
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/lessons/:id', auth, requireTeacher, async (req, res) => {
  try {
    const { title, content, missions, chapter, orderIndex, chapterId } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (missions !== undefined) update.missions = missions;
    if (chapter !== undefined) update.chapter = chapter;
    if (orderIndex !== undefined) update.orderIndex = orderIndex;
    if (chapterId !== undefined) update.chapterId = chapterId;

    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', auth, requireTeacher, async (req, res) => {
  try {
    const grade = req.query.grade ? Number(req.query.grade) : undefined;
    const subject = req.query.subject ? String(req.query.subject) : undefined;

    const courseFilter = {};
    if (grade !== undefined && Number.isFinite(grade)) courseFilter.grade = grade;
    if (subject) courseFilter.subject = subject;

    const courses = await Course.find(courseFilter).sort({ grade: 1, subject: 1 });
    const results = [];

    for (const c of courses) {
      const extracted = await TextbookText.findOne({ grade: c.grade, subject: c.subject }).select('extraction text pages filename updatedAt');
      const chaptersCount = await Chapter.countDocuments({ courseId: c._id });
      const lessonsCount = await Lesson.countDocuments({ courseId: c._id });
      const lessonsWithContent = await Lesson.countDocuments({ courseId: c._id, content: { $exists: true, $ne: '' } });

      results.push({
        courseId: c._id,
        grade: c.grade,
        subject: c.subject,
        title: c.title,
        pdf: { filename: c.textbook?.filename || null },
        extracted: extracted ? {
          exists: true,
          filename: extracted.filename,
          method: extracted.extraction?.method,
          textLength: extracted.text?.length || 0,
          pages: extracted.pages?.length || 0,
          updatedAt: extracted.updatedAt,
        } : { exists: false },
        built: {
          chapters: chaptersCount,
          lessons: lessonsCount,
          lessonsWithContent,
        }
      });
    }

    res.json({ courses: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/textbooks/extract', auth, requireTeacher, async (req, res) => {
  try {
    const { grade, subject, filename, minChars, ocrLang } = req.body;
    if (!subject) return res.status(400).json({ error: 'subject is required' });
    if (grade === undefined || grade === null || Number.isNaN(Number(grade))) {
      return res.status(400).json({ error: 'grade is required' });
    }

    const safeSubject = String(subject).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const safeGrade = String(Number(grade));
    const inferredFilename = `${safeSubject}-${safeGrade}.pdf`;
    const finalFilename = filename || inferredFilename;

    const tempPath = path.join(__dirname, '../../uploads/textbooks', finalFilename);
    if (!fs.existsSync(tempPath)) {
      return res.status(404).json({ error: `Temp PDF not found on host: ${finalFilename}` });
    }

    const jobId = createJobId();
    extractJobs.set(jobId, {
      jobId,
      status: 'running',
      phase: 'starting',
      current: 0,
      total: null,
      page: null,
      startedAt: new Date().toISOString(),
      grade: Number(grade),
      subject: safeSubject,
      filename: finalFilename,
    });

    (async () => {
      try {
        const extracted = await extractTextFromPdf(tempPath, {
          minChars: typeof minChars === 'number' ? minChars : undefined,
          ocrLang,
          onProgress: (p) => {
            const job = extractJobs.get(jobId);
            if (!job || job.status !== 'running') return;
            extractJobs.set(jobId, {
              ...job,
              phase: p.phase || job.phase,
              current: typeof p.current === 'number' ? p.current : job.current,
              total: typeof p.total === 'number' ? p.total : job.total,
              page: p.page ?? job.page,
            });
          },
        });

        const update = {
          grade: Number(grade),
          subject: safeSubject,
          bucketName: 'textbooks',
          filename: finalFilename,
          source: { tempPath },
          extraction: {
            method: extracted.method,
            ocrLang: extracted.ocrLang,
            extractedAt: new Date(),
          },
          text: extracted.text || '',
          pages: Array.isArray(extracted.pages) ? extracted.pages : [],
        };

        const doc = await TextbookText.findOneAndUpdate(
          { grade: Number(grade), subject: safeSubject },
          { $set: update },
          { upsert: true, new: true }
        );

        const job = extractJobs.get(jobId);
        if (job) {
          extractJobs.set(jobId, {
            ...job,
            status: 'done',
            phase: 'done',
            finishedAt: new Date().toISOString(),
            result: {
              grade: doc.grade,
              subject: doc.subject,
              filename: doc.filename,
              method: doc.extraction?.method,
              textLength: doc.text?.length || 0,
              pages: doc.pages?.length || 0,
            },
          });
        }
      } catch (err) {
        const job = extractJobs.get(jobId);
        if (job) {
          extractJobs.set(jobId, {
            ...job,
            status: 'error',
            phase: 'error',
            finishedAt: new Date().toISOString(),
            error: err.message,
          });
        }
      }
    })();

    res.status(202).json({ success: true, jobId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/textbooks/extract/:jobId', auth, requireTeacher, async (req, res) => {
  const job = extractJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

router.post('/textbooks/build', auth, requireTeacher, async (req, res) => {
  try {
    const { grade, subject, replaceExisting } = req.body;
    if (!subject) return res.status(400).json({ error: 'subject is required' });
    if (grade === undefined || grade === null || Number.isNaN(Number(grade))) {
      return res.status(400).json({ error: 'grade is required' });
    }

    const safeSubject = String(subject).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const safeGrade = Number(grade);

    const textbookText = await TextbookText.findOne({ grade: safeGrade, subject: safeSubject });
    if (!textbookText || !textbookText.text || !textbookText.text.trim()) {
      return res.status(404).json({ error: 'No extracted textbook text found. Run /textbooks/extract first.' });
    }

    const courseTitle = safeSubject === 'persian'
      ? `فارسی پایه ${safeGrade}`
      : `${safeSubject} grade ${safeGrade}`;

    const course = await Course.findOneAndUpdate(
      { grade: safeGrade, subject: safeSubject },
      {
        $set: {
          grade: safeGrade,
          subject: safeSubject,
          title: courseTitle,
          textbook: {
            bucketName: 'textbooks',
            filename: textbookText.filename,
            fileId: textbookText.source?.fileId,
          },
        }
      },
      { upsert: true, new: true }
    );

    if (replaceExisting) {
      await Lesson.deleteMany({ courseId: course._id });
      await Chapter.deleteMany({ courseId: course._id });
    }

    const parsedLessons = safeSubject === 'persian'
      ? splitLessonsFa(textbookText.text)
      : [{ number: 1, title: courseTitle, content: textbookText.text.trim() }];

    const results = [];
    for (const l of parsedLessons) {
      const title = l.title && String(l.title).trim() ? String(l.title).trim() : `درس ${l.number}`;
      const content = (l.content || '').trim();
      const summary = content.slice(0, 220);
      const chapter = await Chapter.findOneAndUpdate(
        { courseId: course._id, number: l.number },
        {
          $set: {
            courseId: course._id,
            number: l.number,
            title,
            summary,
          }
        },
        { upsert: true, new: true }
      );

      const lesson = await Lesson.findOneAndUpdate(
        { courseId: course._id, chapterId: chapter._id },
        {
          $set: {
            grade: safeGrade,
            subject: safeSubject,
            courseId: course._id,
            chapterId: chapter._id,
            chapter: l.number,
            orderIndex: l.number,
            title,
            content,
            missions: [],
          }
        },
        { upsert: true, new: true }
      );

      results.push({ chapterId: chapter._id, lessonId: lesson._id, number: l.number, title });
    }

    res.json({
      success: true,
      courseId: course._id,
      chapters: results.length,
      items: results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
