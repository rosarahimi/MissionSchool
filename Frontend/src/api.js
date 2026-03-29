const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '') + '/api';

export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const register = async (userData) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return res.json();
};

export const getProfile = async (token) => {
  const res = await fetch(`${API_URL}/user/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
};

export const updateProfile = async (token, data) => {
  const res = await fetch(`${API_URL}/user/profile/update`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateProgress = async (token, data) => {
  const res = await fetch(`${API_URL}/user/progress`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const curriculumLessonDetails = async (token, lessonId) => {
  const res = await fetch(`${API_URL}/curriculum/lessons/${lessonId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
};

export const curriculumLessonProgress = async (token, lessonId, field) => {
  const res = await fetch(`${API_URL}/curriculum/lessons/${lessonId}/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ field }),
  });
  return res.json();
};

export const generateLessonMissions = async (token, lessonId, opts = {}) => {
  const res = await fetch(`${API_URL}/curriculum/lessons/${lessonId}/missions/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ provider: opts.provider, model: opts.model, maxTokens: opts.maxTokens }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const generateLessonMissionsFromText = async (token, lessonId, text, opts = {}) => {
  const res = await fetch(`${API_URL}/curriculum/lessons/${lessonId}/missions/generate-from-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ text, provider: opts.provider, model: opts.model, maxTokens: opts.maxTokens }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const curriculumTextbookStatus = async (token, subject, grade) => {
  const url = grade !== undefined && grade !== null
    ? `${API_URL}/curriculum/textbooks/status/${subject}/${grade}`
    : `${API_URL}/curriculum/textbooks/status/${subject}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
};

export const curriculumTextbookUpload = async (token, formData) => {
  const res = await fetch(`${API_URL}/curriculum/textbooks/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};

export const curriculumTextbookDelete = async (token, subject, grade) => {
  const url = grade !== undefined && grade !== null
    ? `${API_URL}/curriculum/textbooks/${subject}/${grade}`
    : `${API_URL}/curriculum/textbooks/${subject}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const curriculumStatus = async (token, params = {}) => {
  const qs = new URLSearchParams();
  if (params.grade !== undefined && params.grade !== null) qs.set('grade', String(params.grade));
  if (params.subject) qs.set('subject', params.subject);
  const url = `${API_URL}/curriculum/status${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const curriculumCourses = async (token, params = {}) => {
  const qs = new URLSearchParams();
  if (params.grade !== undefined && params.grade !== null) qs.set('grade', String(params.grade));
  if (params.subject) qs.set('subject', params.subject);
  const url = `${API_URL}/curriculum/courses${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const createCourse = async (token, payload) => {
  const res = await fetch(`${API_URL}/curriculum/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const extractTextbook = async (token, payload) => {
  const res = await fetch(`${API_URL}/curriculum/textbooks/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const getExtractJob = async (token, jobId) => {
  const res = await fetch(`${API_URL}/curriculum/textbooks/extract/${jobId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const buildTextbook = async (token, payload) => {
  const res = await fetch(`${API_URL}/curriculum/textbooks/build`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const curriculumLessons = async (token, params = {}) => {
  const qs = new URLSearchParams();
  if (params.courseId) qs.set('courseId', params.courseId);
  if (params.chapterId) qs.set('chapterId', params.chapterId);
  if (params.includeUnlinked) qs.set('includeUnlinked', '1');
  const url = `${API_URL}/curriculum/lessons${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const createLesson = async (token, payload) => {
  const res = await fetch(`${API_URL}/curriculum/lessons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const deleteLesson = async (token, lessonId) => {
  const res = await fetch(`${API_URL}/curriculum/lessons/${lessonId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const updateChapter = async (token, chapterId, payload) => {
  const res = await fetch(`${API_URL}/curriculum/chapters/${chapterId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const updateLesson = async (token, lessonId, payload) => {
  const res = await fetch(`${API_URL}/curriculum/lessons/${lessonId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const updateCourse = async (token, courseId, payload) => {
  const res = await fetch(`${API_URL}/curriculum/courses/${courseId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};

export const deleteCourse = async (token, courseId) => {
  const res = await fetch(`${API_URL}/curriculum/courses/${courseId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || data?.error || `HTTP ${res.status}` };
  return data;
};
export const getDetailedResults = async (token) => {
  const res = await fetch(`${API_URL}/user/results`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
};
