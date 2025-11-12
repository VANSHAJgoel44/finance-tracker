import React, { createContext, useState, useEffect } from 'react';
import api from '../api';
export const AuthContext =createContext();

export function AuthProvider({ children }) {
  const [user, setUser]= useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      const token =localStorage.getItem('token');
      const stored = localStorage.getItem('user');
      if (!token || !stored) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (e) {
        console.warn('token invalid, clearing storage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, []);

  async function login(email,password) {
    const r = await api.post('/auth/login', { email,password });
    localStorage.setItem('token',r.data.token);
    localStorage.setItem('user',JSON.stringify(r.data.user));
    setUser(r.data.user);
  }
  function logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }
  if (loading) return<div style={{padding:20}}>Loading...</div>;

  return(
    <AuthContext.Provider value={{user, login,logout }}>
      {children}
    </AuthContext.Provider>
  );
}
