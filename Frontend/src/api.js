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

export const getLessons = async (token, subject) => {
  const res = await fetch(`${API_URL}/lessons/${subject}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
};

export const getLessonDetails = async (token, lessonId) => {
  const res = await fetch(`${API_URL}/lessons/details/${lessonId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
};

export const updateLessonProgress = async (token, lessonId, field) => {
  const res = await fetch(`${API_URL}/lessons/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ lessonId, field }),
  });
  return res.json();
};

export const pdfStatus = async (token, subject, grade) => {
  const url = grade !== undefined && grade !== null
    ? `${API_URL}/lessons/pdf-status/${subject}/${grade}`
    : `${API_URL}/lessons/pdf-status/${subject}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
};

export const uploadPdf = async (token, formData) => {
  const res = await fetch(`${API_URL}/lessons/upload-pdf`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData, // FormData doesn't need Content-Type header manually
  });
  return res.json();
};

export const curriculumStatus = async (token, params = {}) => {
  const qs = new URLSearchParams();
  if (params.grade !== undefined && params.grade !== null) qs.set('grade', String(params.grade));
  if (params.subject) qs.set('subject', params.subject);
  const url = `${API_URL}/curriculum/status${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
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
  return res.json();
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
  return res.json();
};

export const curriculumLessons = async (token, params = {}) => {
  const qs = new URLSearchParams();
  if (params.courseId) qs.set('courseId', params.courseId);
  if (params.chapterId) qs.set('chapterId', params.chapterId);
  const url = `${API_URL}/curriculum/lessons${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
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
  return res.json();
};
export const getDetailedResults = async (token) => {
  const res = await fetch(`${API_URL}/user/results`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
};
