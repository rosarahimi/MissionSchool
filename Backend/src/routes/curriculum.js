const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const auth = require('../middleware/auth');
const requireTeacher = require('../middleware/requireTeacher');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Lesson = require('../models/Lesson');
const TextbookText = require('../models/TextbookText');
const { extractTextFromPdf } = require('../services/textExtraction');
const { splitLessonsFa } = require('../services/chapterBuilder');

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

router.post('/courses', auth, async (req, res) => {
  try {
    const { grade, subject, title, textbook, meta } = req.body;
    const course = await Course.create({ grade, subject, title, textbook, meta });
    res.status(201).json(course);
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

router.post('/courses/:courseId/chapters', auth, async (req, res) => {
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

// Lessons (structured)
router.get('/lessons', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.courseId) filter.courseId = req.query.courseId;
    if (req.query.chapterId) filter.chapterId = req.query.chapterId;

    const lessons = await Lesson.find(filter)
      .select('title subject chapter courseId chapterId grade orderIndex')
      .sort({ orderIndex: 1, chapter: 1 });

    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lessons', auth, async (req, res) => {
  try {
    const lesson = await Lesson.create(req.body);
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/lessons/:id', auth, requireTeacher, async (req, res) => {
  try {
    const { title, content, missions } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (missions !== undefined) update.missions = missions;

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

    const extracted = await extractTextFromPdf(tempPath, {
      minChars: typeof minChars === 'number' ? minChars : undefined,
      ocrLang,
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

    res.json({
      success: true,
      grade: doc.grade,
      subject: doc.subject,
      filename: doc.filename,
      method: doc.extraction?.method,
      textLength: doc.text?.length || 0,
      pages: doc.pages?.length || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
