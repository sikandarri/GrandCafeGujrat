import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CustomerContext = createContext(null);

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

export function CustomerProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('gc_customer_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let active = true;
    if (!token) {
      setUser(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    request('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(data => { if (active) setUser(data.user); })
      .catch(() => {
        localStorage.removeItem('gc_customer_token');
        if (active) { setToken(''); setUser(null); }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const persist = data => {
    localStorage.setItem('gc_customer_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async form => persist(await request('/api/auth/register', { method: 'POST', body: JSON.stringify(form) }));
  const login = async form => persist(await request('/api/auth/login', { method: 'POST', body: JSON.stringify(form) }));
  const logout = () => {
    localStorage.removeItem('gc_customer_token');
    setToken('');
    setUser(null);
  };
  const updateProfile = async form => {
    const data = await request('/api/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(() => ({
    token, user, loading, isLoggedIn: Boolean(token && user), register, login, logout, updateProfile,
    authHeaders: token ? { Authorization: `Bearer ${token}` } : {}
  }), [token, user, loading]);

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const value = useContext(CustomerContext);
  if (!value) throw new Error('useCustomer must be used inside CustomerProvider');
  return value;
}
