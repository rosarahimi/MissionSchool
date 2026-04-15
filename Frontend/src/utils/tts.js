export function loadTtsSettings() {
  try {
    const raw = localStorage.getItem('ttsSettings');
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      rate: typeof parsed?.rate === 'number' ? parsed.rate : 1,
      pitch: typeof parsed?.pitch === 'number' ? parsed.pitch : 1,
      volume: typeof parsed?.volume === 'number' ? parsed.volume : 1,
      voiceURI: typeof parsed?.voiceURI === 'string' ? parsed.voiceURI : '',
    };
  } catch {
    return { rate: 1, pitch: 1, volume: 1, voiceURI: '' };
  }
}

export function saveTtsSettings(next) {
  try {
    localStorage.setItem('ttsSettings', JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getLangForSubject(subjectId) {
  if (subjectId === 'persian') return 'fa-IR';
  if (subjectId === 'arabic') return 'ar-SA';
  return 'en-US';
}

export function isRtlLang(lang) {
  return String(lang || '').toLowerCase().startsWith('fa') || String(lang || '').toLowerCase().startsWith('ar');
}

export function splitSpeakChunks(text) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return [];

  const parts = [];
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    buf += ch;

    if (ch === '.' || ch === '!' || ch === '?' || ch === '؟' || ch === '\n') {
      const t = buf.trim();
      if (t) parts.push(t);
      buf = '';
    }
  }
  const tail = buf.trim();
  if (tail) parts.push(tail);

  if (parts.length <= 1) return [s];
  return parts;
}

export function pickBestVoice(voices, lang, preferredURI) {
  const list = Array.isArray(voices) ? voices : [];
  if (preferredURI) {
    const byUri = list.find(v => v?.voiceURI === preferredURI);
    if (byUri) return byUri;
  }
  const langLc = String(lang || '').toLowerCase();
  const exact = list.filter(v => String(v?.lang || '').toLowerCase() === langLc);
  const starts = list.filter(v => String(v?.lang || '').toLowerCase().startsWith(langLc.split('-')[0] || langLc));
  const candidates = (exact.length ? exact : starts.length ? starts : list);
  const local = candidates.find(v => v?.localService);
  const def = candidates.find(v => v?.default);
  return local || def || candidates[0] || null;
}
