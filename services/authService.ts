const API_URL = 'http://localhost:5000/api/auth';

export const registerUser = async (name: string, username: string, email: string, password: string) => {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Registration failed');
  return data;
};

export const loginUser = async (identifier: string, password: string) => {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Login failed');
  return data;
};

export const getUserContext = async (token: string) => {
  const res = await fetch(`${API_URL}/user`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed to fetch user');
  return data;
};
