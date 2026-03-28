function normalizePersianDigits(s) {
  if (!s) return s;
  const map = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  };
  return String(s).replace(/[۰-۹]/g, (d) => map[d] || d);
}

function wordToNumberFa(word) {
  const w = String(word || '').trim();
  const map = {
    'اول': 1,
    'دوم': 2,
    'سوم': 3,
    'چهارم': 4,
    'پنجم': 5,
    'ششم': 6,
    'هفتم': 7,
    'هشتم': 8,
    'نهم': 9,
    'دهم': 10,
    'یازدهم': 11,
    'دوازدهم': 12,
    'سیزدهم': 13,
    'چهاردهم': 14,
    'پانزدهم': 15,
    'شانزدهم': 16,
    'هفدهم': 17,
    'هجدهم': 18,
    'نوزدهم': 19,
    'بیستم': 20,
  };
  return map[w];
}

function cleanTitle(t) {
  return String(t || '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s:\-–—]+/, '')
    .replace(/[\s:\-–—]+$/, '')
    .trim();
}

function guessLessonTitle(headerLine) {
  const line = cleanTitle(headerLine);
  if (!line) return '';
  const parts = line.split(/[:：\-–—]/).map(cleanTitle).filter(Boolean);
  if (parts.length >= 2) return parts[1];
  if (parts.length === 1) return parts[0];
  return '';
}

function splitLessonsFa(text) {
  const raw = String(text || '');
  const t = normalizePersianDigits(raw);

  const re = /(^|\n)\s*(درس)\s*(?:([0-9]{1,2})|([آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+))\s*[:：\-–—]?\s*(.*?)(?=\n)/g;

  const matches = [];
  let m;
  while ((m = re.exec(t)) !== null) {
    const idx = m.index + (m[1] ? m[1].length : 0);
    const numDigits = m[3];
    const numWord = m[4];
    let number = numDigits ? Number(numDigits) : wordToNumberFa(numWord);
    if (!Number.isFinite(number)) continue;
    const headerRemainder = m[5] || '';
    const title = guessLessonTitle(headerRemainder) || cleanTitle(headerRemainder);
    matches.push({ index: idx, number, title, headerLine: m[0] });
  }

  if (matches.length === 0) {
    return [{
      number: 1,
      title: 'کتاب',
      content: raw.trim(),
    }];
  }

  const lessons = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const start = cur.index;
    const end = next ? next.index : t.length;
    const slice = t.slice(start, end).trim();

    const content = slice
      .replace(/^\s*درس\s*(?:[0-9]{1,2}|[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+)\s*[:：\-–—]?\s*/m, '')
      .trim();

    lessons.push({
      number: cur.number,
      title: cur.title || `درس ${cur.number}`,
      content,
    });
  }

  const dedup = new Map();
  for (const l of lessons) {
    if (!dedup.has(l.number)) dedup.set(l.number, l);
  }

  return Array.from(dedup.values()).sort((a, b) => a.number - b.number);
}

module.exports = {
  splitLessonsFa,
};
