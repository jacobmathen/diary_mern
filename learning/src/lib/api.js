// Production backend API. The Express app mounts all API routes under /api.
const apiBaseUrl = 'https://diary-mern.onrender.com/api';

export async function api(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const response = await fetch(apiBaseUrl + normalizedPath, {
    credentials: 'include',
    ...options,
    headers: options.body instanceof FormData
      ? options.headers
      : {
          'Content-Type': 'application/json',
          ...options.headers
        }
  });

  const data = await response.json().catch(() => ({
    message: 'Could not reach the server.'
  }));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.');
    error.status = response.status;
    throw error;
  }

  return data;
}

export const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

export const moods = {
  radiant: { icon: '☀', label: 'Radiant', color: '#e7b251' },
  good: { icon: '☺', label: 'Good', color: '#78a58b' },
  okay: { icon: '◒', label: 'Okay', color: '#849fc2' },
  low: { icon: '☁', label: 'Low', color: '#9b8db9' },
  rough: { icon: '☂', label: 'Rough', color: '#be8f8c' }
};

export const prettyDate = date =>
  new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
