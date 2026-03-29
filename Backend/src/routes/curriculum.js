const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const axios = require('axios');

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

function normalizeAnthropicTextResponse(data) {
  const raw = Array.isArray(data?.content)
    ? data.content.map(i => i?.text || '').join('')
    : '';
  return String(raw || '').trim();
}

function parseMissionsJson(rawText) {
  const clean = String(rawText || '').replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean || '[]');
  if (!Array.isArray(parsed)) {
    throw new Error('AI output must be a JSON array');
  }
  return parsed;
}

function sanitizeGeneratedMissions(missions) {
  const list = Array.isArray(missions) ? missions : [];

  const normalizeOrderText = (s) => {
    return String(s || '')
      .replace(/[\u200c\u200d]/g, '')
      .replace(/[\s\u00A0]+/g, ' ')
      .replace(/[.\u06d4،,:;!؟“”"'«»()\[\]{}]/g, '')
      .trim();
  };

  const splitOrderWords = (input) => {
    if (input === undefined || input === null) return [];
    const raw = String(input).trim();
    if (!raw) return [];
    return raw
      .split(/\s*(?:-|,|،|؛|\|)\s*/g)
      .map(s => String(s || '').trim())
      .map(s => s.replace(/[.\u06d4]+$/g, '').trim())
      .filter(Boolean);
  };

  const wordsFromQuestion = (q) => {
    const rawQ = String(q || '').trim();
    if (!rawQ) return [];
    const parts = rawQ.split(/[:：]/);
    const tail = String(parts.length > 1 ? parts.slice(1).join(':') : rawQ).trim();
    // If there's no clear separators, don't attempt.
    if (!/[-،,]/.test(tail)) return [];
    return splitOrderWords(tail);
  };

  const questionHasEmbeddedWordList = (q) => {
    const rawQ = String(q || '').trim();
    if (!rawQ) return false;
    const parts = rawQ.split(/[:：]/);
    if (parts.length <= 1) return false;
    const tail = String(parts.slice(1).join(':')).trim();
    return !!tail && /[-،,]/.test(tail);
  };

  const cleanOrderQuestion = (q) => {
    const rawQ = String(q || '').trim();
    if (!rawQ) return '';
    const parts = rawQ.split(/[:：]/);
    if (parts.length <= 1) return rawQ;
    return String(parts[0] || '').trim();
  };

  const wordsFromAnswerSentence = (answer) => {
    const raw = String(answer || '').trim();
    if (!raw) return [];
    const cleaned = raw.replace(/[.\u06d4]+$/g, '').trim();
    const words = cleaned.split(/\s+/g).map(s => s.trim()).filter(Boolean);
    return words.length >= 3 ? words : [];
  };

  const normalized = list.map((m) => {
    const type = String(m?.type || '').toLowerCase();
    const stage = Number(m?.stage);
    const q = String(m?.q || '').trim();
    let exp = m?.exp;
    exp = String(exp === undefined || exp === null ? '' : exp).trim();

    const base = {
      type,
      stage,
      q,
      exp: exp || '',
    };

    if (type === 'mcq') {
      const options = Array.isArray(m?.options) ? m.options.map(String) : [];
      const answer = typeof m?.answer === 'number' ? m.answer : Number(m?.answer);
      return {
        ...base,
        options,
        answer: Number.isFinite(answer) ? answer : 0,
      };
    }

    if (type === 'fill') {
      const rawBlank = m?.blank !== undefined && m?.blank !== null ? String(m.blank) : '';
      const blankWord = rawBlank.trim().split(/\s+/g).filter(Boolean)[0] || '';
      return {
        ...base,
        blank: blankWord,
        hint: m?.hint !== undefined ? String(m.hint) : '',
        answer: m?.answer,
      };
    }

    if (type === 'order') {
      const originalAnswer = m?.answer !== undefined ? m.answer : '';
      let words = [];
      if (Array.isArray(m?.words)) {
        words = m.words.map(String).map(s => s.trim()).filter(Boolean);
      } else if (typeof m?.words === 'string') {
        words = splitOrderWords(m.words);
      }
      const extractedFromQ = !words.length;
      if (extractedFromQ) words = wordsFromQuestion(q);
      const answerWords = wordsFromAnswerSentence(originalAnswer);
      if (!words.length) words = answerWords;
      if (answerWords.length >= 3 && words.length < answerWords.length) {
        words = answerWords;
      }

      const qNorm = normalizeOrderText(q);
      const aNorm = normalizeOrderText(originalAnswer);
      const leaksAnswer = !!aNorm && qNorm.includes(aNorm);

      let nextQ = questionHasEmbeddedWordList(q) ? cleanOrderQuestion(q) : q;
      if (leaksAnswer) {
        nextQ = 'ترتیب درست کلمات را بسازید.';
      }
      return {
        ...base,
        q: nextQ,
        words,
        answer: originalAnswer,
      };
    }

    return base;
  });

  return normalized.filter(m => {
    if (!['mcq', 'fill', 'order'].includes(m.type)) return false;
    if (!Number.isFinite(m.stage)) return false;
    if (!String(m.q || '').trim()) return false;
    if (!String(m.exp || '').trim()) return false;
    return true;
  });
}

async function generateMissionsWithAnthropic({ subjectLabel, text, model, maxTokens }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('ANTHROPIC_API_KEY is not set');
    err.statusCode = 500;
    throw err;
  }

  const prompt = `You are an educational game designer for children aged 8-12.
Given this lesson content from a ${subjectLabel} textbook:

"""
${text}
"""

Create exactly 8 educational missions as a JSON array. Each mission must have:
- type: "mcq" | "fill" | "order"
- stage: 1, 2, or 3 (stages 1-2 have 3 missions each, stage 3 has 2)
- q: question text
- For mcq: options (array of 4 strings), answer (index 0-3)
- For fill: blank (EXACTLY ONE WORD, no spaces), hint (one short hint)
- For order: words (array of 4-5 words shuffled), answer (correct sentence)
- exp: short explanation (1-2 sentences) in the same language as the lesson

Return ONLY valid JSON array, no markdown, no extra text.`;

  let res;
  try {
    res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: typeof maxTokens === 'number' ? maxTokens : 1200,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': process.env.ANTHROPIC_VERSION || '2023-06-01',
        },
        timeout: 60_000,
      }
    );
  } catch (err) {
    const status = err?.response?.status;
    const upstream = err?.response?.data;
    const detail = upstream?.error?.message || upstream?.error?.type || JSON.stringify(upstream || {});

    const wrapped = new Error(`Anthropic error${status ? ` (${status})` : ''}: ${detail}`);
    wrapped.statusCode = status || 502;
    wrapped.upstream = upstream;
    throw wrapped;
  }

  const rawText = normalizeAnthropicTextResponse(res.data);
  return parseMissionsJson(rawText);
}

async function generateMissionsWithOpenAI({ subjectLabel, text, model, maxTokens }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error('OPENAI_API_KEY is not set');
    err.statusCode = 500;
    throw err;
  }

  const prompt = `You are an educational game designer for children aged 8-12.
Given this lesson content from a ${subjectLabel} textbook:

"""
${text}
"""

Create exactly 8 educational missions as a JSON array. Each mission must have:
- type: "mcq" | "fill" | "order"
- stage: 1, 2, or 3 (stages 1-2 have 3 missions each, stage 3 has 2)
- q: question text
- For mcq: options (array of 4 strings), answer (index 0-3)
- For fill: blank (EXACTLY ONE WORD, no spaces), hint (one short hint)
- For order: words (array of 4-5 words shuffled), answer (correct sentence)
- exp: short explanation (1-2 sentences) in the same language as the lesson

Return ONLY valid JSON array, no markdown, no extra text.`;

  let res;
  try {
    res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Return only valid JSON. Do not wrap in markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: typeof maxTokens === 'number' ? maxTokens : 1200,
      },
      {
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${apiKey}`,
        },
        timeout: 60_000,
      }
    );
  } catch (err) {
    const status = err?.response?.status;
    const upstream = err?.response?.data;
    const detail = upstream?.error?.message || upstream?.error?.type || JSON.stringify(upstream || {});

    const wrapped = new Error(`OpenAI error${status ? ` (${status})` : ''}: ${detail}`);
    wrapped.statusCode = status || 502;
    wrapped.upstream = upstream;
    throw wrapped;
  }

  const rawText = String(res?.data?.choices?.[0]?.message?.content || '').trim();
  return parseMissionsJson(rawText);
}

async function generateMissions({ provider, subjectLabel, text, model, maxTokens }) {
  const p = String(provider || process.env.MISSION_AI_PROVIDER || 'anthropic').toLowerCase();
  if (p === 'openai' || p === 'gpt') {
    return generateMissionsWithOpenAI({ subjectLabel, text, model, maxTokens });
  }
  return generateMissionsWithAnthropic({ subjectLabel, text, model, maxTokens });
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

router.post('/lessons/:id/missions/generate', auth, requireTeacher, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).select('content subject grade missions');
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    const text = String(lesson.content || '').trim();
    if (!text) return res.status(400).json({ error: 'Lesson content is empty' });

    const subjectLabel = String(lesson.subject || 'lesson');
    const missions = await generateMissions({
      provider: req.body?.provider,
      subjectLabel,
      text,
      model: req.body?.model,
      maxTokens: req.body?.maxTokens,
    });
    const safeMissions = sanitizeGeneratedMissions(missions);
    if (!safeMissions.length) return res.status(422).json({ error: 'No missions generated' });

    lesson.missions = safeMissions;
    await lesson.save();
    res.json({ success: true, lessonId: lesson._id, missions: safeMissions });
  } catch (err) {
    const status = err.statusCode || err?.response?.status || 500;
    res.status(status).json({
      error: err.message || 'Mission generation failed',
      ...(err?.upstream ? { upstream: err.upstream } : {}),
    });
  }
});

router.post('/lessons/:id/missions/generate-from-text', auth, requireTeacher, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).select('subject missions');
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'text is required' });

    const subjectLabel = String(lesson.subject || 'lesson');
    const missions = await generateMissions({
      provider: req.body?.provider,
      subjectLabel,
      text,
      model: req.body?.model,
      maxTokens: req.body?.maxTokens,
    });
    const safeMissions = sanitizeGeneratedMissions(missions);
    if (!safeMissions.length) return res.status(422).json({ error: 'No missions generated' });

    lesson.missions = safeMissions;
    await lesson.save();
    res.json({ success: true, lessonId: lesson._id, missions: safeMissions });
  } catch (err) {
    const status = err.statusCode || err?.response?.status || 500;
    res.status(status).json({
      error: err.message || 'Mission generation failed',
      ...(err?.upstream ? { upstream: err.upstream } : {}),
    });
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

    const courseFilter = Number.isFinite(grade)
      ? { grade: Number(grade), subject: safeSubject }
      : { subject: safeSubject };
    await Course.updateMany(courseFilter, { $unset: { textbook: '' } });

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

    const chapterId = lesson.chapterId ? String(lesson.chapterId) : null;
    await Lesson.deleteOne({ _id: lesson._id });

    if (chapterId) {
      const remaining = await Lesson.countDocuments({ chapterId });
      if (remaining === 0) {
        await Chapter.deleteOne({ _id: chapterId });
      }
    }

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

    const last = await Course.findOne({ grade: safeGrade, subject: safeSubject })
      .select('buildNumber')
      .sort({ buildNumber: -1 });
    const nextBuildNumber = (Number(last?.buildNumber) || 0) + 1;

    const course = await Course.create({
      grade: safeGrade,
      subject: safeSubject,
      buildNumber: nextBuildNumber,
      title: courseTitle,
      ...(textbook !== undefined ? { textbook } : {}),
      ...(meta !== undefined ? { meta } : {}),
    });

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
      .select('title subject chapter courseId chapterId grade orderIndex origin createdAt')
      .populate('chapterId', 'courseId number title summary origin createdAt')
      .sort({ createdAt: 1 });

    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/lessons/:id', auth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('chapterId', 'courseId number title summary origin createdAt');
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
    const payload = {
      grade: req.body.grade,
      subject: req.body.subject,
      courseId: req.body.courseId,
      chapterId: req.body.chapterId,
      chapter: req.body.chapter,
      orderIndex: req.body.orderIndex,
      title: req.body.title,
      content: req.body.content,
      missions: Array.isArray(req.body.missions) ? req.body.missions : [],
      origin: 'manual',
    };

    if (payload.grade === undefined || payload.grade === null || Number.isNaN(Number(payload.grade))) {
      return res.status(400).json({ error: 'grade is required' });
    }
    if (!payload.subject) return res.status(400).json({ error: 'subject is required' });
    if (!payload.title) return res.status(400).json({ error: 'title is required' });
    if (!payload.content) return res.status(400).json({ error: 'content is required' });

    const courseId = payload.courseId ? String(payload.courseId) : '';
    if (courseId) {
      const chapterNumber = Number(payload.chapter);
      if (!Number.isFinite(chapterNumber)) {
        return res.status(400).json({ error: 'chapter number is required' });
      }

      const title = String(req.body.chapterTitle || '').trim() || `فصل ${chapterNumber}`;
      const ch = await Chapter.findOneAndUpdate(
        { courseId, number: chapterNumber },
        {
          $set: { title, number: chapterNumber, courseId },
          $setOnInsert: { origin: 'manual' },
        },
        { upsert: true, new: true }
      );

      payload.chapterId = ch._id;
      payload.chapter = chapterNumber;
      if (payload.orderIndex === undefined || payload.orderIndex === null) {
        const last = await Lesson.findOne({ chapterId: ch._id }).select('orderIndex').sort({ orderIndex: -1 });
        payload.orderIndex = (Number(last?.orderIndex) || 0) + 1;
      }
    } else if (payload.chapterId) {
      if (payload.orderIndex === undefined || payload.orderIndex === null) {
        const last = await Lesson.findOne({ chapterId: payload.chapterId }).select('orderIndex').sort({ orderIndex: -1 });
        payload.orderIndex = (Number(last?.orderIndex) || 0) + 1;
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

    const courses = await Course.find(courseFilter).sort({ createdAt: -1, grade: 1, subject: 1 });
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
        buildNumber: c.buildNumber,
        title: c.title,
        createdAt: c.createdAt,
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
    const { grade, subject, replaceExisting, confirmReplace } = req.body;
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

    const last = await Course.findOne({ grade: safeGrade, subject: safeSubject })
      .select('buildNumber')
      .sort({ buildNumber: -1 });
    const nextBuildNumber = (Number(last?.buildNumber) || 0) + 1;

    // New behavior: every build creates a NEW course row (a new build instance)
    // and builds chapters/lessons under that courseId.
    const course = await Course.create({
      grade: safeGrade,
      subject: safeSubject,
      buildNumber: nextBuildNumber,
      title: courseTitle,
      textbook: {
        bucketName: 'textbooks',
        filename: textbookText.filename,
        fileId: textbookText.source?.fileId,
      },
    });

    // Backwards-compat fields, now ignored because we always build into a new course.
    const wantsReplace = !!replaceExisting;
    const allowReplace = String(confirmReplace || '').trim() === 'REPLACE';

    const parsedLessons = safeSubject === 'persian'
      ? splitLessonsFa(textbookText.text)
      : [{ number: 1, title: courseTitle, content: textbookText.text.trim() }];

    const results = [];
    for (const l of parsedLessons) {
      const title = l.title && String(l.title).trim() ? String(l.title).trim() : `درس ${l.number}`;
      const content = (l.content || '').trim();
      const summary = content.slice(0, 220);
      const chapter = await Chapter.create({
        courseId: course._id,
        number: l.number,
        title,
        summary,
        origin: 'build',
      });

      const lesson = await Lesson.create({
        grade: safeGrade,
        subject: safeSubject,
        courseId: course._id,
        chapterId: chapter._id,
        chapter: l.number,
        orderIndex: l.number,
        title,
        content,
        origin: 'build',
        missions: [],
      });

      results.push({ chapterId: chapter._id, lessonId: lesson._id, number: l.number, title });
    }

    res.json({
      success: true,
      courseId: course._id,
      chapters: results.length,
      items: results,
      ...(wantsReplace ? { warning: 'replaceExisting is ignored: build now always creates a new Course row' } : {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
