const API_URL = '/api/auth';

export const registerUser = async (name: string, username: string, email: string, password: string) => {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, email, password }),
  });

  const data = await res.headers.get('content-type')?.includes('application/json') 
    ? await res.json() 
    : { msg: await res.text() };

  if (!res.ok) {
    const errorMsg = data.msg || `Registration failed with status: ${res.status}`;
    console.error('Registration Error Details:', { status: res.status, data });
    throw new Error(errorMsg);
  }
  return data;
};

export const loginUser = async (identifier: string, password: string) => {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await res.headers.get('content-type')?.includes('application/json') 
    ? await res.json() 
    : { msg: await res.text() };

  if (!res.ok) {
    const errorMsg = data.msg || `Login failed with status: ${res.status}`;
    console.error('Login Error Details:', { status: res.status, data });
    throw new Error(errorMsg);
  }
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

  const data = await res.headers.get('content-type')?.includes('application/json') 
    ? await res.json() 
    : { msg: await res.text() };

  if (!res.ok) throw new Error(data.msg || 'Failed to fetch user');
  return data;
};

export const requestPasswordReset = async (identifier: string) => {
  const res = await fetch(`${API_URL}/request-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier }),
  });

  const data = await res.headers.get('content-type')?.includes('application/json') 
    ? await res.json() 
    : { msg: await res.text() };

  if (!res.ok) throw new Error(data.msg || 'Reset request failed');
  return data;
};

export const resetPassword = async (identifier: string, newPassword: string) => {
  const res = await fetch(`${API_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, newPassword }),
  });

  const data = await res.headers.get('content-type')?.includes('application/json') 
    ? await res.json() 
    : { msg: await res.text() };

  if (!res.ok) throw new Error(data.msg || 'Password reset failed');
  return data;
};
